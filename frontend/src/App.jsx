import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getProfile, checkReady } from './lib/api';
import './App.css';

// Temporary connectivity check only — not the real portfolio UI. Proves the
// frontend can reach the locked backend (GET /ready and GET /profile) with
// no CORS/network/parsing errors. Visual design intentionally minimal.
function ConnectivityCheck() {
  const [ready, setReady] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkReady()
      .then((res) => setReady(res.ok))
      .catch(() => setReady(false));

    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="connectivity-check">
      <h1>PORTFOLIO FRONTEND</h1>
      <p>
        Backend:{' '}
        {ready === null ? 'Checking…' : ready ? 'Connected' : 'Unreachable'}
      </p>

      <h2>Profile</h2>
      {error && <p className="error">Error: {error}</p>}
      {!error && !profile && <p>Loading…</p>}
      {profile && (
        <ul>
          <li>name: {profile.name || '(empty)'}</li>
          <li>headline: {profile.headline || '(empty)'}</li>
        </ul>
      )}
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConnectivityCheck />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
