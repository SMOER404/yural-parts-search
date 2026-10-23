import SearchForm from './components/SearchForm';
import BrandList from './components/BrandList';
import OffersTable from './components/OffersTable';
import { isDemo } from './api/favorit';

export default function App() {
  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h1 className="h3 mb-3">Подбор автозапчастей</h1>
      {isDemo && (
        <div className="alert alert-warning small">
          Демо-режим: ключ API не задан, показываются тестовые данные. Попробуйте артикулы <b>0189</b> или{' '}
          <b>7160500039S</b>.
        </div>
      )}
      <SearchForm />
      <BrandList />
      <OffersTable />
    </div>
  );
}
