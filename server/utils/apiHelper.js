/**
 * apiHelper.js
 * -----------
 * Reusable Axios instance preconfigured for OpenWeatherMap,
 * plus utilities to shape and aggregate API responses.
 */

const axios = require("axios");

// --- Axios instance with OpenWeather base URL ---
const weatherAPI = axios.create({
  baseURL: "https://api.openweathermap.org/data/2.5",
  timeout: 10000, // 10 s timeout
});

// --- Allowed unit systems (whitelist for validation) ---
const VALID_UNITS = ["metric", "imperial"];

/**
 * Validate and normalise the `units` query parameter.
 *
 * @param {string} units — raw value from the request
 * @returns {string} A validated unit string ("metric" or "imperial")
 */
function normalizeUnits(units) {
  const lower = String(units ?? "").toLowerCase().trim();
  return VALID_UNITS.includes(lower) ? lower : "metric";
}

/**
 * Extract a flat current-weather summary from the raw OpenWeather response.
 * Isolates the shaping logic so the route handler stays lean.
 *
 * @param {Object} raw — response.data from /weather endpoint
 * @returns {Object}   — cleaned current-weather object
 */
function shapeCurrentWeather(raw) {
  const { name, sys, main, wind, weather } = raw;
  const primary = weather?.[0] || {};

  return {
    city: name,
    country: sys?.country ?? "—",
    temp: Math.round(main?.temp ?? 0),
    feelsLike: Math.round(main?.feels_like ?? 0),
    humidity: main?.humidity ?? 0,
    windSpeed: wind?.speed ?? 0,
    description: primary.description || "N/A",
    icon: primary.icon || "01d",
  };
}

/**
 * Aggregate 3-hour forecast entries into per-day summaries.
 *
 * OpenWeather's free tier returns ~40 data points (every 3 h for 5 days).
 * We group them by calendar date and extract:
 *   - day label, representative icon & description (midday)
 *   - high / low temperature
 *
 * @param {Array} list — forecast list from OpenWeather API
 * @returns {Array}      Array of daily summary objects (max 5 days)
 */
function aggregateForecast(list) {
  // Guard: return early if the list is empty or missing
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  const dayMap = {};

  for (const entry of list) {
    // Safely extract the date portion (YYYY-MM-DD) from the timestamp
    const datePart = entry.dt_txt?.split(" ")[0];
    if (!datePart) continue; // skip malformed entries

    if (!dayMap[datePart]) {
      dayMap[datePart] = { date: datePart, temps: [], icons: [], descriptions: [] };
    }

    const temp = entry.main?.temp;
    const icon = entry.weather?.[0]?.icon;
    const desc = entry.weather?.[0]?.description;

    if (temp !== undefined) dayMap[datePart].temps.push(temp);
    if (icon) dayMap[datePart].icons.push(icon);
    if (desc) dayMap[datePart].descriptions.push(desc);
  }

  // Convert map → sorted array, pick the midday icon/description
  return Object.values(dayMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5) // cap at 5 days
    .map((day) => {
      const midIndex = Math.floor(day.icons.length / 2);
      return {
        date: day.date,
        tempMin: day.temps.length ? Math.round(Math.min(...day.temps)) : 0,
        tempMax: day.temps.length ? Math.round(Math.max(...day.temps)) : 0,
        icon: day.icons[midIndex] || "01d",
        description: day.descriptions[midIndex] || "N/A",
      };
    });
}

/**
 * Map an Axios / network error to a user-friendly { status, message } pair.
 * Centralises error mapping so every route doesn't repeat the same logic.
 *
 * @param {Error} err — error thrown by Axios
 * @returns {{ status: number, message: string }}
 */
function mapWeatherApiError(err) {
  // Upstream API returned an HTTP error
  if (err.response) {
    const status = err.response.status;

    const errorMap = {
      404: { status: 404, message: "City not found. Please check the name and try again." },
      401: { status: 502, message: "Invalid API key. Please check server configuration." },
      429: { status: 429, message: "Too many requests. Please wait a moment and try again." },
    };

    return errorMap[status] || {
      status: 502,
      message: "Weather service returned an error. Please try again later.",
    };
  }

  // Network-level failures (timeout, DNS, etc.)
  if (err.code === "ECONNABORTED") {
    return { status: 504, message: "Request to weather service timed out. Please try again." };
  }
  if (err.code === "ERR_NETWORK" || err.code === "ENOTFOUND") {
    return { status: 504, message: "Weather service is unreachable. Please try again later." };
  }

  // Completely unexpected error
  return { status: 500, message: "An unexpected error occurred." };
}

module.exports = {
  weatherAPI,
  normalizeUnits,
  shapeCurrentWeather,
  aggregateForecast,
  mapWeatherApiError,
};
