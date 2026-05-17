/**
 * Forecast.jsx
 * ------------
 * Renders the 5-day forecast as a horizontal scrollable row
 * of ForecastCard components.
 */

import ForecastCard from "./ForecastCard";

export default function Forecast({ data, unit }) {
  if (!data || data.length === 0) return null;

  return (
    <section className="forecast" id="forecast-section">
      <h2 className="forecast__title">5-Day Forecast</h2>
      <div className="forecast__grid">
        {data.map((day, i) => (
          <ForecastCard key={day.date} day={day} unit={unit} index={i} />
        ))}
      </div>
    </section>
  );
}
