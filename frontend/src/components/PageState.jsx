/**
 * Loading / empty / error presentation shared by every page.
 * Pass onRetry to render a retry button on errors.
 */
export default function PageState({ status, title, body, onRetry }) {
  if (status === 'loading') {
    return (
      <div className="pm-state" role="status" aria-live="polite">
        <span className="pm-state__bar" />
        <p className="pm-state__body">{body || 'Loading\u2026'}</p>
      </div>
    );
  }

  return (
    <div className="pm-state" role={status === 'error' ? 'alert' : undefined}>
      <h2 className="pm-state__title">{title}</h2>
      {body ? <p className="pm-state__body">{body}</p> : null}
      {status === 'error' && onRetry ? (
        <button type="button" className="pm-btn" onClick={onRetry}>
          <span className="pm-btn__icon" aria-hidden="true">&#8635;</span>
          <span className="pm-btn__label">Try again</span>
        </button>
      ) : null}
    </div>
  );
}
