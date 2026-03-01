import { useState, useEffect, useRef } from 'react';
import { getForecast } from '../services/weatherstack';
import { ErrorType } from '../services/weatherstack';
import { getCachedForecast, setCachedForecast } from '../utils/weatherCache';
import styles from './ForecastPanel.module.css';

export function ForecastPanel({ query, units, active = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedQueryRef = useRef(null);

  const unitLabel = units === 'f' ? '°F' : '°C';

  // When query or units change, try to show cached forecast for this location (no API call)
  useEffect(() => {
    if (!query?.trim()) {
      setData(null);
      setError(null);
      lastFetchedQueryRef.current = null;
      return;
    }
    const cacheKey = `${query.trim()}|${units}`;
    const cached = getCachedForecast(query.trim(), units);
    if (cached) {
      setData(cached);
      setError(null);
      lastFetchedQueryRef.current = cacheKey;
    } else if (lastFetchedQueryRef.current !== cacheKey) {
      setData(null);
      setError(null);
    }
  }, [query, units]);

  const loadForecast = () => {
    if (!query?.trim() || loading) return;
    const cacheKey = `${query.trim()}|${units}`;
    const cached = getCachedForecast(query.trim(), units);
    if (cached) {
      setData(cached);
      setError(null);
      lastFetchedQueryRef.current = cacheKey;
      return;
    }
    setLoading(true);
    setError(null);
    getForecast(query.trim(), { units, forecast_days: 7 })
      .then((res) => {
        setData(res);
        setCachedForecast(query.trim(), units, res);
        lastFetchedQueryRef.current = cacheKey;
      })
      .catch((e) => {
        const msg =
          e.type === ErrorType.RATE_LIMIT
            ? 'Rate limit exceeded. Try again later.'
            : e.type === ErrorType.PLAN_LIMIT
              ? 'Multi-day forecast is available on Professional and higher plans.'
              : e.message || 'Forecast not available';
        setError(msg);
        lastFetchedQueryRef.current = cacheKey;
      })
      .finally(() => setLoading(false));
  };

  if (!query?.trim()) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>7-day forecast</h3>
        <p className={styles.placeholder}>Search for a location to see the forecast.</p>
        <p className={styles.upgrade}>Available on Professional and higher plans.</p>
      </div>
    );
  }

  if (data?.forecast && typeof data.forecast === 'object') {
    const days = Object.entries(data.forecast)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 7);
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>7-day forecast</h3>
        <div className={styles.grid}>
          {days.map(([date, day]) => (
            <div key={date} className={styles.day}>
              <span className={styles.date}>{date}</span>
              <span className={styles.temp}>
                {day.maxtemp != null ? day.maxtemp : day.temperature_max ?? '—'} /{' '}
                {day.mintemp != null ? day.mintemp : day.temperature_min ?? '—'} {unitLabel}
              </span>
              <span className={styles.desc}>
                {day.condition ?? day.weather_descriptions?.[0] ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>7-day forecast</h3>
        <p className={styles.loading}>Loading forecast…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>7-day forecast</h3>
        <div className={styles.errorBanner}>{error}</div>
        <p className={styles.upgrade}>Multi-day forecast is available on Professional and higher plans.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>7-day forecast</h3>
      <p className={styles.placeholder}>Load forecast for this location (uses 1 API call).</p>
      <button type="button" className={styles.loadBtn} onClick={loadForecast} disabled={loading}>
        Load 7-day forecast
      </button>
      <p className={styles.upgrade}>Available on Professional and higher plans.</p>
    </div>
  );
}
