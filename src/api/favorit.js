import { mockFetch } from './mock';

const KEY = import.meta.env.VITE_FAVORIT_KEY;
export const isDemo = !KEY;

// Сообщения API → понятный текст для пользователя.
// Сверяем по смыслу, а не по точному тексту: живой API отвечает не теми строками,
// что в документации (например, «The API key provided is invalid or has been revoked» со статусом 403).
const API_ERRORS = [
  [/empty key/i, 'Не указан ключ API'],
  [/invalid key|key.*(invalid|revoked)/i, 'Неверный ключ API'],
  [/empty number/i, 'Не указан артикул'],
  [/quota|rate limit|too many/i, 'Превышен лимит запросов, попробуйте позже'],
];

const humanize = (msg) => (API_ERRORS.find(([re]) => re.test(msg)) || [null, msg])[1];

// Спецсимволы в number/brand — процентным кодированием (%23 для #, %26 для &), как требует документация
function buildUrl(params) {
  const qs = Object.entries({ key: KEY, ...params })
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `/api/?${qs}`;
}

async function request(params) {
  if (isDemo) return mockFetch(params);

  let res;
  try {
    res = await fetch(buildUrl(params));
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз');
  }

  // Тело читаем всегда: API кладёт текст ошибки в JSON и при статусе 4xx
  let data = null;
  try {
    data = await res.json();
  } catch {
    // не JSON — разберёмся по статусу ниже
  }
  if (data?.error) throw new Error(humanize(String(data.error)));
  if (!res.ok) throw new Error(`Сервер ответил ошибкой ${res.status}`);
  if (!data) throw new Error('Сервер вернул некорректный ответ');
  return data;
}

// API при «не найдено» возвращает массив с одной пустой структурой — отбрасываем такие
const isReal = (g) => g && g.brand && g.number;

// Склад: цена берётся именно отсюда — корневое поле price в документации помечено «НЕ ИСПОЛЬЗОВАТЬ»
const toWarehouse = (w, i) => ({
  id: `${w.id || i}-${w.shipmentDate || ''}`,
  code: w.code || '—',
  own: Boolean(w.own),
  price: typeof w.price === 'number' && w.price > 0 ? w.price : null,
  stock: w.stock || 0,
  shipmentDate: w.shipmentDate || null,
  notRefund: Boolean(w.notRefund),
});

function toRow(g, isOriginal) {
  const warehouses = (g.warehouses || [])
    .map(toWarehouse)
    .sort((a, b) => (b.stock > 0) - (a.stock > 0) || (a.price ?? Infinity) - (b.price ?? Infinity));
  const inStock = warehouses.filter((w) => w.stock > 0 && w.price != null);
  const shipments = inStock.map((w) => w.shipmentDate).filter(Boolean).sort();
  return {
    id: g.goodsID || `${g.brand}-${g.number}`,
    brand: g.brand,
    number: g.number,
    name: g.name || '—',
    stock: g.count ?? inStock.reduce((s, w) => s + w.stock, 0),
    price: inStock.length ? Math.min(...inStock.map((w) => w.price)) : null,
    nearestShipment: shipments[0] || null,
    rate: g.rate || 1,
    notRefund: Boolean(g.notRefund),
    warehouses,
    isOriginal,
  };
}

/** Шаг 1: производители, у которых есть деталь с таким артикулом */
export async function fetchBrands(number) {
  const data = await request({ number });
  const seen = new Map();
  (data.goods || []).filter(isReal).forEach((g) => {
    if (!seen.has(g.brand)) seen.set(g.brand, { brand: g.brand, number: g.number, name: g.name || '', count: g.count || 0 });
  });
  // сначала те, что есть в наличии
  return [...seen.values()].sort((a, b) => (b.count > 0) - (a.count > 0));
}

/**
 * Шаг 2: деталь и её аналоги. По схеме из документации передаём номер, который ввёл пользователь,
 * и выбранного производителя (API отдаёт номер в своём формате, например 7160500039/S или 01-89).
 */
export async function fetchOffers(number, brand) {
  const data = await request({ number, brand, analogues: 'on', info: 'on' });
  const rows = [];
  (data.goods || []).filter(isReal).forEach((g) => {
    rows.push(toRow(g, true));
    (g.analogues || []).filter(isReal).forEach((a) => rows.push(toRow(a, false)));
  });
  return rows;
}
