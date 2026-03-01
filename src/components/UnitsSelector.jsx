import styles from './UnitsSelector.module.css';

const OPTIONS = [
  { value: 'm', label: '°C' },
  { value: 'f', label: '°F' },
  { value: 's', label: 'K' },
];

export function UnitsSelector({ value, onChange }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Units</span>
      <div className={styles.buttons}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.btn} ${value === opt.value ? styles.active : ''}`}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
