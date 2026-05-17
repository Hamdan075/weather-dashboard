/**
 * UnitToggle.jsx
 * --------------
 * Toggle switch between Metric (°C) and Imperial (°F) units.
 * Pill-style animated toggle.
 */

export default function UnitToggle({ unit, onToggle }) {
  return (
    <div className="unit-toggle" id="unit-toggle">
      <button
        className={`unit-toggle__btn ${unit === "metric" ? "unit-toggle__btn--active" : ""}`}
        onClick={() => onToggle("metric")}
        aria-label="Switch to Celsius"
      >
        °C
      </button>
      <button
        className={`unit-toggle__btn ${unit === "imperial" ? "unit-toggle__btn--active" : ""}`}
        onClick={() => onToggle("imperial")}
        aria-label="Switch to Fahrenheit"
      >
        °F
      </button>
    </div>
  );
}
