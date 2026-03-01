import { useState } from 'react';
import { getHistoricalWeather } from '../services/weatherstack';
import { ErrorType } from '../services/weatherstack';
import styles from './HistoricalPanel.module.css';

function formatDateInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function HistoricalPanel({ query, units }) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDateInput(d);
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const unitLabel = units === 'f' ? '°F' : '°C';

  const handleFetch = () => {
    if (!query?.trim() || !date) return;
    setLoading(true);
    setError(null);
    setData(null);
    getHistoricalWeather(query.trim(), date, { units })
      .then(setData)
      .catch((e) => {
        const msg = e.type === ErrorType.RATE_LIMIT
          ? 'Rate limit exceeded. Try again later.'
          : e.message || 'Historical data not available';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  if (!query?.trim()) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.title}>Historical weather</h3>
        <p className={styles.placeholder}>Search for a location, then pick a date.</p>
        <p className={styles.upgrade}>Available on Standard and higher plans.</p>
      </div>
    );
  }

  const historical = data?.historical?.[date];
  const dayData = historical ?? data?.current;
  const temp = dayData?.temperature ?? dayData?.avgtemp ?? (dayData?.maxtemp != null && dayData?.mintemp != null ? (Number(dayData.maxtemp) + Number(dayData.mintemp)) / 2 : null);
  const displayData = dayData ? { ...dayData, temperature: temp } : null;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Historical weather</h3>
      <div className={styles.controls}>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={formatDateInput(new Date())}
          disabled={loading}
        />
        <button
          type="button"
          className={styles.btn}
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Get history'}
        </button>
      </div>
      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}
      {error && (
        <p className={styles.upgrade}>Historical weather is available on Standard and higher plans.</p>
      )}
      {loading && <p className={styles.loading}>Loading…</p>}
      {!loading && displayData && (
        <div className={styles.result}>
          <p className={styles.resultDate}>{date}</p>
          <p className={styles.resultTemp}>
            {displayData.temperature != null ? Math.round(displayData.temperature) : '—'} {unitLabel}
            {displayData.weather_descriptions?.[0] && ` — ${displayData.weather_descriptions[0]}`}
          </p>
          {(displayData.precip != null || displayData.humidity != null) && (
            <p className={styles.resultMeta}>
              Precip: {displayData.precip ?? 0} mm · Humidity: {displayData.humidity ?? '—'}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
