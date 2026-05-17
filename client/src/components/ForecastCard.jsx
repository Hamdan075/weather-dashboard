/**
 * ForecastCard.jsx
 * ----------------
 * A single day card in the 5-day forecast row.
 * Shows day name, weather icon, high/low temps.
 */

/**
 * Convert a YYYY-MM-DD string to a short weekday label.
 * @param {string} dateStr
 * @returns {string} e.g. "Mon"
 */
function getDayLabel(dateStr) {
  const date = new Date(dateStr + "T12:00:00"); // noon to avoid timezone shift
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Friendly labels for today / tomorrow
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function ForecastCard({ day, unit, index }) {
  const unitSymbol = unit === "metric" ? "°" : "°";

  return (
    <div
      className="forecast-card"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <p className="forecast-card__day">{getDayLabel(day.date)}</p>

      <img
        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
        alt={day.description}
        className="forecast-card__icon"
      />

      <p className="forecast-card__temps">
        <span className="forecast-card__high">{day.tempMax}{unitSymbol}</span>
        <span className="forecast-card__low">{day.tempMin}{unitSymbol}</span>
      </p>

      <p className="forecast-card__desc">{day.description}</p>
    </div>
  );
}
