import styles from './CurrentWeather.module.css';

function formatTime(str) {
  if (!str) return '—';
  return str;
}

export function CurrentWeather({ data, units }) {
  if (!data?.current || !data?.location) return null;

  const { current } = data;
  const { location } = data;
  const unitLabel = units === 'f' ? '°F' : units === 's' ? 'K' : '°C';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.location}>{location.name}</h2>
          <p className={styles.region}>{[location.region, location.country].filter(Boolean).join(', ')}</p>
        </div>
        <p className={styles.obs}>Observed {formatTime(current.observation_time)}</p>
      </div>

      <div className={styles.main}>
        <div className={styles.tempWrap}>
          <span className={styles.temp}>{current.temperature}</span>
          <span className={styles.unit}>{unitLabel}</span>
        </div>
        <p className={styles.desc}>
          {current.weather_descriptions?.[0] ?? '—'}
        </p>
        {current.weather_icons?.[0] && (
          <img src={current.weather_icons[0]} alt="" className={styles.icon} />
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Feels like</span>
          <span className={styles.value}>{current.feelslike} {unitLabel}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Humidity</span>
          <span className={styles.value}>{current.humidity}%</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Wind</span>
          <span className={styles.value}>{current.wind_speed} km/h {current.wind_dir ?? ''}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Pressure</span>
          <span className={styles.value}>{current.pressure} mb</span>
        </div>
        {current.uv_index != null && (
          <div className={styles.row}>
            <span className={styles.label}>UV index</span>
            <span className={styles.value}>{current.uv_index}</span>
          </div>
        )}
        {current.visibility != null && (
          <div className={styles.row}>
            <span className={styles.label}>Visibility</span>
            <span className={styles.value}>{current.visibility} km</span>
          </div>
        )}
        {current.precip != null && (
          <div className={styles.row}>
            <span className={styles.label}>Precipitation</span>
            <span className={styles.value}>{current.precip} mm</span>
          </div>
        )}
        {current.cloudcover != null && (
          <div className={styles.row}>
            <span className={styles.label}>Cloud cover</span>
            <span className={styles.value}>{current.cloudcover}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
