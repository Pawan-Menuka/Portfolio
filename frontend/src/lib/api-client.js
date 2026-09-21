export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}

export function createApiClient(configuredUrl, fetcher = (...args) => fetch(...args)) {
  function baseUrl() {
    try {
      const url = new URL(configuredUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
      return url.href.replace(/\/+$/, '');
    } catch { throw new ApiError('Portfolio data is not configured. Please try again later.'); }
  }
  async function read(url, options = {}, envelope = true) {
    const { headers: supplied, ...rest } = options;
    const headers = new Headers(supplied);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (typeof rest.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    let response;
    try { response = await fetcher(url, { ...rest, headers, credentials: 'include' }); }
    catch (error) {
      if (options.signal?.aborted || error.name === 'AbortError') throw error;
      throw new ApiError('Unable to reach portfolio data. Please try again.');
    }
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success === false) throw new ApiError(typeof body?.error === 'string' ? body.error : `Unable to load portfolio data (${response.status}).`, response.status);
    if (!body || typeof body !== 'object' || (envelope && body.success !== true)) throw new ApiError('Portfolio data returned an unexpected response.', response.status);
    return body;
  }
  return {
    request(path, options) { return Promise.resolve().then(() => {
      if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError('Invalid API path.');
      return read(`${baseUrl()}${path}`, options);
    }); },
    ready(options) { return Promise.resolve().then(() => read(`${new URL(baseUrl()).origin}/ready`, options, false)); },
  };
}
