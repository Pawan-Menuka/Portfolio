export default function ResourceState({ loading, error, retry, label = 'content' }) {
  if (loading) return <p className="resource-state" role="status">Loading {label}…</p>;
  if (error) return <div className="notice resource-state" role="alert"><span>{error.message}</span><button onClick={retry}>Try again</button></div>;
  return null;
}
