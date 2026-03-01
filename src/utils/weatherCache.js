const CACHE_KEY = 'weather_app_current';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCachedWeather(query, units) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { query: q, units: u, data, timestamp } = JSON.parse(raw);
    if (q !== query || u !== units) return null;
    if (Date.now() - timestamp > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedWeather(query, units, data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ query, units, data, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function getCachedQueryAndUnits() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { query, units, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TTL_MS) return null;
    return { query, units };
  } catch {
    return null;
  }
}

// Forecast cache: avoid repeated forecast API calls (saves rate limit)
const FORECAST_CACHE_KEY = 'weather_app_forecast';
const FORECAST_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCachedForecast(query, units) {
  try {
    const raw = sessionStorage.getItem(FORECAST_CACHE_KEY);
    if (!raw) return null;
    const { query: q, units: u, data, timestamp } = JSON.parse(raw);
    if (q !== query || u !== units) return null;
    if (Date.now() - timestamp > FORECAST_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedForecast(query, units, data) {
  try {
    sessionStorage.setItem(
      FORECAST_CACHE_KEY,
      JSON.stringify({ query, units, data, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
}
