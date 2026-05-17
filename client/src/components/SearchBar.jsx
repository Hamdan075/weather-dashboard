/**
 * SearchBar.jsx
 * -------------
 * City search input with an animated submit button.
 * Glassmorphic styling with focus glow effect.
 */

import { useState } from "react";

export default function SearchBar({ onSearch, isLoading }) {
  const [city, setCity] = useState("");

  /** Handle form submission */
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__input-wrapper">
        {/* Search icon */}
        <svg
          className="search-bar__icon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          id="city-search-input"
          type="text"
          className="search-bar__input"
          placeholder="Search city… e.g. London, Tokyo, New York"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
      </div>

      <button
        id="search-submit-btn"
        type="submit"
        className="search-bar__btn"
        disabled={isLoading || !city.trim()}
      >
        {isLoading ? (
          <span className="search-bar__spinner" />
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
