import { useDispatch, useSelector } from 'react-redux';
import { searchBrands, searchOffers } from '../store/searchSlice';
import { Loader, ErrorAlert, Empty } from './Status';

export default function BrandList() {
  const dispatch = useDispatch();
  const { number, brands, selectedBrand } = useSelector((s) => s.search);

  if (brands.status === 'idle') return null;
  if (brands.status === 'loading') return <Loader text="Ищем производителей…" />;
  if (brands.status === 'error')
    return <ErrorAlert message={brands.error} onRetry={() => dispatch(searchBrands(number))} />;
  if (!brands.items.length) return <Empty text={`По артикулу «${number}» ничего не найдено`} />;

  return (
    <section className="mb-4">
      <h2 className="h5">Шаг 1. Выберите производителя</h2>
      <div className="list-group">
        {brands.items.map((b) => {
          const active = b.brand === selectedBrand;
          return (
            <button
              key={b.brand}
              type="button"
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3 ${
                active ? 'active' : ''
              }`}
              // По схеме из документации: номер, который ввёл пользователь, + выбранный производитель
              onClick={() => dispatch(searchOffers({ number, brand: b.brand }))}
            >
              <span>
                <span className="fw-semibold">{b.brand}</span>
                <span className={`ms-2 small ${active ? '' : 'text-secondary'}`}>{b.number}</span>
              </span>
              <span className={`text-end ${active ? '' : 'text-secondary'}`}>
                {b.name}
                {!b.count && <span className="badge text-bg-light border ms-2">нет в наличии</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
