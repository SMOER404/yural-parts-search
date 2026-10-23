import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchOffers } from '../store/searchSlice';
import { Loader, ErrorAlert, Empty } from './Status';

const PAGE = 50;

const money = (v) =>
  v == null ? '—' : v.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });

// shipmentDate: дата — день отгрузки, время — до какого часа нужно заказать
const shipment = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
  return `${day}, заказ до ${time}`;
};

const SORTS = {
  price: { label: 'Сначала дешевле', fn: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) },
  stock: { label: 'Больше остаток', fn: (a, b) => b.stock - a.stock },
  date: {
    label: 'Быстрее отгрузка',
    fn: (a, b) => (a.nearestShipment || '9').localeCompare(b.nearestShipment || '9'),
  },
};

export default function OffersTable() {
  const dispatch = useDispatch();
  const { number, selectedBrand, offers } = useSelector((s) => s.search);
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [sort, setSort] = useState('price');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(() => new Set());

  // Новый производитель — сбрасываем пагинацию и раскрытые строки
  useEffect(() => {
    setLimit(PAGE);
    setOpen(new Set());
  }, [selectedBrand, offers.items]);

  const rows = useMemo(() => {
    const original = offers.items.filter((o) => o.isOriginal);
    const analogues = offers.items
      .filter((o) => !o.isOriginal && (!onlyInStock || o.stock > 0))
      .sort((a, b) => (b.stock > 0) - (a.stock > 0) || SORTS[sort].fn(a, b));
    // искомая деталь всегда первой строкой
    return [...original, ...analogues];
  }, [offers.items, onlyInStock, sort]);

  if (!selectedBrand || offers.status === 'idle') return null;
  if (offers.status === 'loading') return <Loader text="Загружаем аналоги и предложения…" />;
  if (offers.status === 'error')
    return (
      <ErrorAlert
        message={offers.error}
        onRetry={() => dispatch(searchOffers({ number, brand: selectedBrand }))}
      />
    );
  if (!offers.items.length) return <Empty text="Предложений нет" />;

  const total = offers.items.filter((o) => !o.isOriginal).length;
  const shown = rows.slice(0, limit);
  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section>
      <h2 className="h5">
        Шаг 2. Аналоги и предложения: {selectedBrand} {number}
      </h2>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
        <span className="text-secondary small">
          Аналогов: {total}
          {onlyInStock && total !== rows.length - 1 && `, в наличии: ${rows.length - 1}`}
        </span>
        <div className="form-check form-switch m-0">
          <input
            id="inStock"
            className="form-check-input"
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="inStock">
            Только в наличии
          </label>
        </div>
        <select
          className="form-select form-select-sm w-auto ms-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Сортировка"
        >
          {Object.entries(SORTS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle bg-white mb-2">
          <thead className="table-light">
            <tr>
              <th>Название</th>
              <th>Производитель</th>
              <th>Артикул</th>
              <th className="text-end">Цена от</th>
              <th className="text-end">Остаток</th>
              <th className="text-end">Ближайшая отгрузка</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => {
              const isOpen = open.has(o.id);
              const canOpen = o.warehouses.length > 0;
              return (
                <Fragment key={o.id}>
                  <tr
                    className={`${o.stock ? '' : 'text-secondary'} ${o.isOriginal ? 'table-primary' : ''}`}
                    style={canOpen ? { cursor: 'pointer' } : undefined}
                    onClick={canOpen ? () => toggle(o.id) : undefined}
                    aria-expanded={canOpen ? isOpen : undefined}
                  >
                    <td>
                      {canOpen && <span className="me-1 text-secondary">{isOpen ? '▾' : '▸'}</span>}
                      {o.name}
                      {o.isOriginal && <span className="badge text-bg-primary ms-2">искомая</span>}
                      {o.notRefund && <span className="badge text-bg-warning ms-2">невозвратная</span>}
                    </td>
                    <td>{o.brand}</td>
                    <td className="text-nowrap">{o.number}</td>
                    <td className="text-end text-nowrap">{money(o.price)}</td>
                    <td className="text-end text-nowrap">{o.stock ? `${o.stock} шт.` : 'нет'}</td>
                    <td className="text-end text-nowrap small">{shipment(o.nearestShipment)}</td>
                  </tr>
                  {isOpen && (
                    <tr className="table-light">
                      <td colSpan={6} className="p-0">
                        <table className="table table-sm mb-0 small">
                          <thead>
                            <tr>
                              <th className="ps-4">Склад</th>
                              <th className="text-end">Цена</th>
                              <th className="text-end">Остаток</th>
                              <th className="text-end pe-3">Отгрузка</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.warehouses.map((w) => (
                              <tr key={w.id} className={w.stock ? '' : 'text-secondary'}>
                                <td className="ps-4">
                                  {w.code}
                                  {w.own && <span className="badge text-bg-success ms-2">свой склад</span>}
                                  {w.notRefund && <span className="badge text-bg-warning ms-2">невозвратная</span>}
                                </td>
                                <td className="text-end text-nowrap">{money(w.price)}</td>
                                <td className="text-end text-nowrap">{w.stock ? `${w.stock} шт.` : 'нет'}</td>
                                <td className="text-end text-nowrap pe-3">{shipment(w.shipmentDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > limit && (
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setLimit((l) => l + PAGE)}>
          Показать ещё {Math.min(PAGE, rows.length - limit)} из {rows.length - limit}
        </button>
      )}
      {rows.length <= 1 && onlyInStock && total > 0 && (
        <div className="text-secondary small">Аналогов в наличии нет — снимите фильтр «Только в наличии».</div>
      )}
    </section>
  );
}
