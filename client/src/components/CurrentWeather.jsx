/**
 * CurrentWeather.jsx
 * ------------------
 * Displays current weather conditions for the searched city.
 * Features animated entrance and glassmorphic card design.
 */

export default function CurrentWeather({ data, unit }) {
  if (!data) return null;

  const { city, country, temp, feelsLike, humidity, windSpeed, description, icon } = data;
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "m/s" : "mph";

  return (
    <div className="current-weather" id="current-weather-card">
      {/* Left section — temperature & location */}
      <div className="current-weather__main">
        <div className="current-weather__icon-wrapper">
          <img
            src={`https://openweathermap.org/img/wn/${icon}@4x.png`}
            alt={description}
            className="current-weather__icon"
          />
        </div>

        <div className="current-weather__temp-block">
          <h1 className="current-weather__temp">
            {temp}<span className="current-weather__unit">{unitSymbol}</span>
          </h1>
          <p className="current-weather__description">{description}</p>
        </div>
      </div>

      {/* Right section — details */}
      <div className="current-weather__details">
        <h2 className="current-weather__city">
          {city}, <span className="current-weather__country">{country}</span>
        </h2>

        <div className="current-weather__meta-grid">
          <div className="current-weather__meta-item">
            <span className="current-weather__meta-label">Feels like</span>
            <span className="current-weather__meta-value">{feelsLike}{unitSymbol}</span>
          </div>

          <div className="current-weather__meta-item">
            <span className="current-weather__meta-label">Humidity</span>
            <span className="current-weather__meta-value">{humidity}%</span>
          </div>

          <div className="current-weather__meta-item">
            <span className="current-weather__meta-label">Wind</span>
            <span className="current-weather__meta-value">{windSpeed} {windUnit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
