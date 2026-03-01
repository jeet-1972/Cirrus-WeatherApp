/**
 * Weatherstack API client
 * Docs: https://docs.apilayer.com/weatherstack/docs/api-documentation
 * Endpoints: /current (Free+), /forecast (Pro+), /historical (Standard+), /marine (Standard+), /autocomplete (Standard+)
 */

const BASE = 'https://api.weatherstack.com';
// Prefer env var (set in Vercel → Settings → Environment Variables). Fallback so deploy works if env is missing.
const KEY = import.meta.env.VITE_WEATHERSTACK_ACCESS_KEY || 'cc227b214881451d37eb9f8216cc3263';

export const ErrorType = {
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_KEY: 'INVALID_KEY',
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  PLAN_LIMIT: 'PLAN_LIMIT',
  OTHER: 'OTHER',
};

function buildUrl(path, params = {}) {
  if (!KEY || String(KEY).trim() === '') {
    const isVercel = typeof window !== 'undefined' && /vercel\.app/i.test(window.location?.hostname ?? '');
    const msg = isVercel
      ? 'API key not set for this deployment. Add VITE_WEATHERSTACK_ACCESS_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.'
      : 'API key is not configured. Add VITE_WEATHERSTACK_ACCESS_KEY to .env (or your host\'s environment variables) and restart.';
    throw Object.assign(new Error(msg), { type: ErrorType.INVALID_KEY });
  }
  const search = new URLSearchParams({ access_key: KEY, ...params });
  return `${BASE}${path}?${search.toString()}`;
}

function parseApiError(data) {
  if (!data?.error) return null;
  const info = data.error.info || data.error.type || 'Unknown error';
  const code = data.error.code;
  let type = ErrorType.OTHER;
  let message = info;
  if (code === 104 || /rate\s*limit|limitation|exceeded/i.test(info)) {
    type = ErrorType.RATE_LIMIT;
    message = 'You have exceeded the API rate limit for your plan. Try again later or see the Rate Limits section in the API documentation.';
  } else if (code === 101 || /invalid.*key|access key/i.test(info)) {
    type = ErrorType.INVALID_KEY;
    message = 'Invalid or missing API key. Check your environment configuration (e.g. .env or Vercel Environment Variables).';
  } else if (code === 615 || /not found|no result/i.test(info)) {
    type = ErrorType.NOT_FOUND;
    message = 'Location not found. Try a different city or ZIP code.';
  } else if (code === 605 || /invalid.*language|language code/i.test(info)) {
    type = ErrorType.OTHER;
    message = 'Invalid language parameter. Using default (language parameter omitted).';
  } else if (code === 603 || code === 609 || /subscription|plan|not supported/i.test(info)) {
    type = ErrorType.PLAN_LIMIT;
  }
  const err = new Error(message);
  err.type = type;
  err.code = code;
  return err;
}

async function request(path, params = {}) {
  const url = buildUrl(path, params);
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    const err = new Error('Network error. Check your connection and try again.');
    err.type = ErrorType.NETWORK;
    err.cause = e;
    throw err;
  }
  let data;
  try {
    data = await res.json();
  } catch {
    const err = new Error(res.ok ? 'Invalid response from server.' : `Request failed (${res.status}).`);
    err.type = ErrorType.OTHER;
    throw err;
  }
  if (data.error) {
    throw parseApiError(data) || new Error(data.error.info || data.error.type || 'API error');
  }
  return data;
}

export async function getCurrentWeather(query, options = {}) {
  if (!query || String(query).trim() === '') {
    throw Object.assign(new Error('Location query is required.'), { type: ErrorType.OTHER });
  }
  const { units = 'm' } = options;
  return request('/current', { query: String(query).trim(), units });
}

export async function getForecast(query, options = {}) {
  if (!query || String(query).trim() === '') {
    throw Object.assign(new Error('Location query is required.'), { type: ErrorType.OTHER });
  }
  const { forecast_days = 7, units = 'm' } = options;
  return request('/forecast', { query: String(query).trim(), forecast_days, units });
}

export async function getHistoricalWeather(query, historical_date, options = {}) {
  if (!query || String(query).trim() === '') {
    throw Object.assign(new Error('Location query is required.'), { type: ErrorType.OTHER });
  }
  if (!historical_date || !/^\d{4}-\d{2}-\d{2}$/.test(historical_date)) {
    throw Object.assign(new Error('Valid historical date (YYYY-MM-DD) is required.'), { type: ErrorType.OTHER });
  }
  const { units = 'm' } = options;
  return request('/historical', { query: String(query).trim(), historical_date, units });
}

export async function getMarineWeather(lat, lon, options = {}) {
  const query = `${lat},${lon}`;
  return request('/marine', { query });
}

/**
 * Location autocomplete (Standard+). Falls back to no suggestions on free plan.
 * Does not throw on error to avoid consuming quota; returns [] on failure.
 */
export async function getLocationSuggestions(search) {
  if (!search || String(search).trim().length < 2) return [];
  if (!KEY || String(KEY).trim() === '') return [];
  try {
    const data = await request('/autocomplete', { query: String(search).trim() });
    const list = data.results ?? data.locations ?? (data.location ? [data.location] : []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
