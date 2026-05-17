/**
 * App.jsx
 * -------
 * Root component for the Weather Dashboard.
 * Manages application state and orchestrates child components.
 */

import { useState, useCallback } from "react";
import { fetchWeather } from "./services/weatherService";
import SearchBar from "./components/SearchBar";
import CurrentWeather from "./components/CurrentWeather";
import Forecast from "./components/Forecast";
import UnitToggle from "./components/UnitToggle";
import ErrorMessage from "./components/ErrorMessage";
import Loader from "./components/Loader";

export default function App() {
  // --- State ---
  const [weatherData, setWeatherData] = useState(null); // { current, forecast }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("metric"); // "metric" | "imperial"
  const [lastCity, setLastCity] = useState(""); // remember last searched city

  /**
   * Search for weather data by city name.
   * Accepts an optional unit override so the unit-toggle can
   * re-fetch without a stale closure on `unit`.
   *
   * @param {string} city         — city to look up
   * @param {string} selectedUnit — unit to use for this request
   */
  const handleSearch = useCallback(async (city, selectedUnit = "metric") => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWeather(city, selectedUnit);
      setWeatherData(data);
      setLastCity(city);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []); // no deps — selectedUnit is always passed explicitly

  /**
   * Handle a new search from the SearchBar.
   * Wraps handleSearch so the current unit is forwarded automatically.
   */
  const onSearch = useCallback(
    (city) => handleSearch(city, unit),
    [handleSearch, unit]
  );

  /**
   * When the user toggles units, re-fetch with the new unit
   * so temperatures come back correctly from the API.
   */
  const handleUnitToggle = useCallback(
    (newUnit) => {
      if (newUnit === unit) return;
      setUnit(newUnit);
      if (lastCity) {
        handleSearch(lastCity, newUnit);
      }
    },
    [unit, lastCity, handleSearch]
  );

  /** Dismiss the error banner */
  const dismissError = useCallback(() => setError(null), []);

  // --- Determine if we have data to show ---
  const hasData = Boolean(weatherData?.current);

  return (
    <div className="app">
      {/* Animated background orbs */}
      <div className="app__bg-orb app__bg-orb--1" />
      <div className="app__bg-orb app__bg-orb--2" />
      <div className="app__bg-orb app__bg-orb--3" />

      <header className="app__header">
        <div className="app__brand">
          {/* Cloud icon */}
          <svg
            className="app__logo"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          <h1 className="app__title">Weather Dashboard</h1>
        </div>

        {hasData && <UnitToggle unit={unit} onToggle={handleUnitToggle} />}
      </header>

      <main className="app__main">
        <SearchBar onSearch={onSearch} isLoading={loading} />

        <ErrorMessage message={error} onDismiss={dismissError} />

        {loading && <Loader />}

        {!loading && hasData && (
          <div className="app__results">
            <CurrentWeather data={weatherData.current} unit={unit} />
            <Forecast data={weatherData.forecast} unit={unit} />
          </div>
        )}

        {/* Empty state — shown before first search */}
        {!loading && !hasData && !error && (
          <div className="app__empty">
            <svg
              className="app__empty-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
            <p className="app__empty-text">
              Search for a city to see the current weather and 5-day forecast.
            </p>
          </div>
        )}
      </main>

      <footer className="app__footer">
        <p>
          Powered by{" "}
          <a
            href="https://openweathermap.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenWeatherMap
          </a>
        </p>
      </footer>
    </div>
  );
}
