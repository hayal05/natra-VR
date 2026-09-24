// Stand-in for `src/api/client.js`. Serves fixtures instead of calling a
// backend, with the scenario picked from the page URL so a check can drive
// every state Home can be in:
//   ?scenario=normal|loading|error|empty   -> browse endpoints
//   &search=ok|loading|error|empty         -> /search
//   &latency=<ms>                          -> artificial delay (default 0)
import { CATEGORIES, FOODS, RESTAURANTS } from './fixtures.js';

const q = new URLSearchParams(window.location.search);
const scenario = q.get('scenario') || 'normal';
const searchScenario = q.get('search') || 'ok';
const latency = Number(q.get('latency') || 0);

export class ApiError extends Error {}

const never = (signal) =>
  new Promise((_, reject) => {
    signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });

const respond = (body, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(body), latency);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });
  });

const fail = () => Promise.reject(new ApiError('Mock API failure'));

function get(path, { signal } = {}) {
  const isSearch = path.startsWith('/search');
  const mode = isSearch ? searchScenario : scenario;
  if (mode === 'loading') return never(signal);
  if (mode === 'error') return fail();

  const empty = mode === 'empty';
  if (isSearch) {
    return respond(
      empty ? { restaurants: [], foods: [] } : { restaurants: RESTAURANTS.slice(0, 4), foods: FOODS },
      signal
    );
  }
  if (path.startsWith('/categories/live')) return respond({ categories: empty ? [] : CATEGORIES }, signal);
  if (path.startsWith('/restaurants')) return respond({ restaurants: empty ? [] : RESTAURANTS }, signal);
  if (path.startsWith('/foods/popular')) return respond({ foods: empty ? [] : FOODS }, signal);
  return Promise.reject(new ApiError(`No mock for ${path}`));
}

export const api = { get, post: fail, patch: fail, delete: fail };
