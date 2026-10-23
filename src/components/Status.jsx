export function Loader({ text = 'Загрузка…' }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-3" role="status">
      <div className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function Empty({ text }) {
  return <div className="alert alert-secondary">{text}</div>;
}
