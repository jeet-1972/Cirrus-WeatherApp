import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWeather } from './services/weatherstack';
import { ErrorType } from './services/weatherstack';
import { getCachedWeather, setCachedWeather, getCachedQueryAndUnits } from './utils/weatherCache';
import { SearchBar } from './components/SearchBar';
import { CurrentWeather } from './components/CurrentWeather';
import { ForecastPanel } from './components/ForecastPanel';
import { HistoricalPanel } from './components/HistoricalPanel';
import { UnitsSelector } from './components/UnitsSelector';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

const DEFAULT_QUERY = 'New York';
const THEME_KEY = 'cirrus_theme';

function App() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [units, setUnits] = useState('m');
  const [tab, setTab] = useState('forecast');
  const [theme, setTheme] = useState(() => {
    try {
      return (localStorage.getItem(THEME_KEY) || 'dark');
    } catch {
      return 'dark';
    }
  });
  const initialLoadDone = useRef(false);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const fetchCurrent = useCallback(async (q, options = {}) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    const useUnits = options.units ?? units;

    const cached = getCachedWeather(searchQuery, useUnits);
    if (cached && options.useCache !== false) {
      setCurrent(cached);
      setQuery(searchQuery);
      setError(null);
      setErrorType(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorType(null);
    try {
      const data = await getCurrentWeather(searchQuery, { units: useUnits });
      setCurrent(data);
      setQuery(searchQuery);
      setCachedWeather(searchQuery, useUnits, data);
    } catch (e) {
      setError(e.message || 'Failed to load weather');
      setErrorType(e.type || ErrorType.OTHER);
      if (e.type === ErrorType.RATE_LIMIT) {
        const fallbackForRequested = getCachedWeather(searchQuery, useUnits);
        const fallbackOther = getCachedWeather(searchQuery, units) || (searchQuery !== query ? getCachedWeather(query, useUnits) : null);
        const fallback = fallbackForRequested || fallbackOther;
        if (fallback) {
          setCurrent(fallback);
          if (fallbackForRequested) setQuery(searchQuery);
        } else {
          setCurrent(null);
        }
      } else {
        setCurrent(null);
      }
    } finally {
      setLoading(false);
    }
  }, [query, units]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const cachedMeta = getCachedQueryAndUnits();
    const initialQuery = cachedMeta?.query ?? DEFAULT_QUERY;
    const initialUnits = cachedMeta?.units ?? 'm';
    setQuery(initialQuery);
    setUnits(initialUnits);
    const cached = getCachedWeather(initialQuery, initialUnits);
    if (cached) {
      setQuery(initialQuery);
      setUnits(initialUnits);
      setCurrent(cached);
      setLoading(false);
      return;
    }
    fetchCurrent(initialQuery, { units: initialUnits, useCache: false });
  }, []);

  const handleUnitsChange = (newUnits) => {
    setUnits(newUnits);
    const cached = getCachedWeather(query, newUnits);
    if (cached) {
      setCurrent(cached);
      setError(null);
      setErrorType(null);
      return;
    }
    if (query.trim()) fetchCurrent(query, { units: newUnits, useCache: false });
  };

  const handleSearch = (q) => {
    setQuery(q);
    fetchCurrent(q);
  };

  const isRateLimit = errorType === ErrorType.RATE_LIMIT;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Cirrus</h1>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <section className="search-section">
        <SearchBar onSearch={handleSearch} loading={loading} placeholder="City, region, or ZIP code" disableAutocomplete={isRateLimit} />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <UnitsSelector value={units} onChange={handleUnitsChange} />
        </div>
      </section>

      {error && (
        <div className={`error-banner ${isRateLimit ? 'error-banner--rate-limit' : ''}`}>
          {error}
          {isRateLimit && current && (
            <span className="error-banner__hint"> Showing last cached data.</span>
          )}
          {isRateLimit && !current && (
            <span className="error-banner__hint"> Try again later or check the API documentation for rate limits.</span>
          )}
        </div>
      )}

      {loading && !current && <p className="loading">Loading current weather…</p>}

      {current && !loading && (
        <>
          <section className="current-section">
            <CurrentWeather data={current} units={units} />
          </section>

          <div className="tabs">
            <button type="button" className={`tab ${tab === 'forecast' ? 'active' : ''}`} onClick={() => setTab('forecast')}>
              Forecast
            </button>
            <button type="button" className={`tab ${tab === 'historical' ? 'active' : ''}`} onClick={() => setTab('historical')}>
              Historical
            </button>
          </div>

          {tab === 'forecast' && <ForecastPanel query={query} units={units} />}
          {tab === 'historical' && <HistoricalPanel query={query} units={units} />}
        </>
      )}

      {!current && !loading && error && (
        <div className="panel empty-state">
          <p className="empty-state__text">
            {errorType === ErrorType.INVALID_KEY
              ? 'Add VITE_WEATHERSTACK_ACCESS_KEY in Vercel → Settings → Environment Variables, then redeploy. For local dev, add it to .env.'
              : errorType === ErrorType.NETWORK
                ? 'Check your connection and try again.'
                : 'Enter a location above to see weather. If you see a rate limit message, wait a while before searching again.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
