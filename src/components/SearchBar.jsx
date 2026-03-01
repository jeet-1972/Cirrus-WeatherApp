import { useState, useRef, useEffect } from 'react';
import { getLocationSuggestions } from '../services/weatherstack';
import styles from './SearchBar.module.css';

export function SearchBar({ onSearch, loading, placeholder = 'City, region, or ZIP', disableAutocomplete = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (disableAutocomplete || !query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const list = await getLocationSuggestions(query.trim());
        setSuggestions(Array.isArray(list) ? list : []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, disableAutocomplete]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const submit = (value) => {
    const q = (value ?? query).trim();
    if (q) onSearch(q);
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') submit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = suggestions[activeIndex >= 0 ? activeIndex : 0];
      const name = typeof item === 'string' ? item : (item?.name ?? item?.query ?? query);
      setQuery(name);
      submit(name);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const displaySuggestions = suggestions.slice(0, 8);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputWrap}>
        <span className={styles.icon} aria-hidden>⌕</span>
        <input
          type="text"
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={loading}
          autoComplete="off"
          aria-label="Search location"
        />
        <button
          type="button"
          className={styles.btn}
          onClick={() => submit()}
          disabled={loading || !query.trim()}
          aria-label="Search"
        >
          {loading ? '…' : 'Search'}
        </button>
      </div>
      {showSuggestions && displaySuggestions.length > 0 && (
        <ul className={styles.suggestions} role="listbox">
          {displaySuggestions.map((item, i) => {
            const name = typeof item === 'string' ? item : (item?.name ?? item?.query ?? String(item));
            return (
              <li
                key={i}
                role="option"
                aria-selected={i === activeIndex}
                className={`${styles.suggestion} ${i === activeIndex ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); setQuery(name); submit(name); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
