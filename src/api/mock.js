// Демо-данные в формате API Favorit — чтобы приложение можно было посмотреть без ключа.
// Попробуйте артикулы 0189 или 7160500039S; «error» имитирует сбой, остальное — «не найдено».

const wh = (code, price, stock, shipmentDate, own = false) => ({
  id: `${code}-${price}`,
  code,
  own,
  price,
  stock,
  shipmentDate,
});

const DB = {
  '0189': [
    {
      goodsID: '1', brand: 'ZEN', number: '0189', name: 'Бендикс стартера', count: 7,
      warehouses: [wh('МС2', 1450, 4, '2026-10-27T15:30:00+03:00', true), wh('СПБ РС', 1510, 3, '2026-10-29T13:30:00+03:00')],
      analogues: [
        { goodsID: '2', brand: 'CARGO', number: '133150', name: 'Бендикс стартера', count: 3,
          warehouses: [wh('МСК РС', 1290, 3, '2026-10-28T14:30:00+03:00')] },
        { goodsID: '3', brand: 'KRAUF', number: 'BDM1234', name: 'Бендикс стартера', count: 0,
          warehouses: [wh('МСК РС', 1180, 0, '2026-10-30T14:30:00+03:00')] },
        { goodsID: '4', brand: 'BOSCH', number: '1006209682', name: 'Бендикс стартера', count: 12,
          warehouses: [wh('МС2', 2340, 2, '2026-10-27T15:30:00+03:00', true), wh('СПБ РС', 2190, 10, '2026-10-31T13:30:00+03:00')] },
      ],
    },
    { goodsID: '5', brand: 'NGK/NTK', number: '0189', name: 'Свеча зажигания', count: 0, warehouses: [], analogues: [] },
    {
      goodsID: '6', brand: 'CAFFARO', number: '01-89', name: 'Ролик натяжной', count: 6,
      warehouses: [wh('МС2', 429.96, 6, '2026-10-27T15:30:00+03:00', true)],
      analogues: [
        { goodsID: '7', brand: 'INA', number: '532013410', name: 'Ролик натяжной', count: 9,
          warehouses: [wh('МСК РС', 615.5, 9, '2026-10-28T14:30:00+03:00')] },
      ],
    },
  ],
  '7160500039S': [
    {
      goodsID: '8', brand: 'MEYLE', number: '7160500039/S', name: 'Рычаги задней подвески (компл. на 2 стороны)', count: 20,
      warehouses: [wh('МС2', 12533.62, 20, '2026-10-27T15:30:00+03:00', true)],
      analogues: [
        { goodsID: '9', brand: 'Mapco', number: '53612/1', name: 'Комплект рычагов задней подвески', count: 10,
          warehouses: [wh('ПТ4', 8680.2, 10, '2026-10-28T13:30:00+03:00')] },
      ],
    },
  ],
};

// Как и живой API: номер ищем без учёта разделителей («01-89», «7160500039/S»)
const norm = (s) => s.toUpperCase().replace(/[^0-9A-ZА-Я]/g, '');

export async function mockFetch({ number, brand, analogues }) {
  await new Promise((r) => setTimeout(r, 600));
  if (number.toLowerCase() === 'error') throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз');
  const items = DB[norm(number)];
  if (!items) return { goods: [{ brand: '', number: '', name: '', count: 0, warehouses: [] }] }; // так API отвечает «не найдено»
  if (!brand) return { goods: items.map(({ analogues: _a, ...g }) => g) };
  return {
    goods: items
      .filter((g) => g.brand === brand)
      .map((g) => (analogues === 'on' ? g : { ...g, analogues: [] })),
  };
}
