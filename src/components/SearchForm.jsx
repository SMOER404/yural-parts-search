import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { searchBrands, reset } from '../store/searchSlice';

const MIN_LEN = 3;
const DEBOUNCE_MS = 500;

export default function SearchForm() {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const timer = useRef(null);

  // Поиск «по факту ввода»: ждём паузу в наборе, чтобы не дёргать API на каждую букву
  useEffect(() => {
    clearTimeout(timer.current);
    const number = value.trim();
    if (number.length < MIN_LEN) {
      if (!number) dispatch(reset());
      return;
    }
    timer.current = setTimeout(() => dispatch(searchBrands(number)), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [value, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    clearTimeout(timer.current);
    const number = value.trim();
    if (number) dispatch(searchBrands(number));
  };

  return (
    <form onSubmit={onSubmit} className="mb-4">
      <label htmlFor="number" className="form-label fw-semibold">
        Артикул детали
      </label>
      <div className="input-group input-group-lg">
        <input
          id="number"
          className="form-control"
          placeholder="Например, 0189"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={!value.trim()}>
          Найти
        </button>
      </div>
      <div className="form-text">Поиск начнётся сам, когда вы введёте от {MIN_LEN} символов</div>
    </form>
  );
}
