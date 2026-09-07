import { pathToFileURL } from 'node:url';
import path from 'node:path';

// app.js decides several things (trust proxy, CORS allowlist, ...) once, at
// module-evaluation time, from process.env — so testing different env
// configurations needs a fresh module instance per configuration. The
// cache-busting query string forces Node to re-evaluate app.js; its own
// internal imports (routes/index.js etc.) are NOT re-evaluated, since those
// use plain specifiers already in the module cache from other test files —
// so this doesn't double-register mongoose models.
export async function freshApp(envOverrides = {}) {
  const original = { ...process.env };
  Object.assign(process.env, envOverrides);
  try {
    const appPath = pathToFileURL(path.resolve('src/app.js')).href;
    const mod = await import(`${appPath}?bust=${Date.now()}-${Math.random()}`);
    return mod.default;
  } finally {
    process.env = original;
  }
}
