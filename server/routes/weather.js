/**
 * weather.js (routes)
 * -------------------
 * Express router for weather-related endpoints.
 *
 * GET /api/weather?city=<name>&units=<metric|imperial>
 *   → Returns current weather + 5-day forecast for the given city.
 */

const express = require("express");
const router = express.Router();
const {
  weatherAPI,
  normalizeUnits,
  shapeCurrentWeather,
  aggregateForecast,
  mapWeatherApiError,
} = require("../utils/apiHelper");

/**
 * GET /api/weather
 *
 * Query params:
 *   - city  (required) — city name, e.g. "London"
 *   - units (optional) — "metric" (default) or "imperial"
 *
 * Response (200):
 *   { current: { city, country, temp, … }, forecast: [{ date, tempMin, … }] }
 *
 * Error responses:
 *   400 — missing city | 404 — city not found | 429 — rate limited
 *   502 — upstream API error | 504 — upstream timeout/unreachable
 */
router.get("/", async (req, res, next) => {
  try {
    const { city, units } = req.query;

    // --- Input validation ---
    if (!city || !city.trim()) {
      return res.status(400).json({ error: "City name is required." });
    }

    const sanitizedCity = city.trim();
    const validUnits = normalizeUnits(units);
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // Fail fast if the server has no API key configured
    if (!apiKey || apiKey === "your_api_key_here") {
      return res.status(503).json({
        error: "Weather service is not configured. Please set OPENWEATHER_API_KEY in the server .env file.",
      });
    }

    // --- Shared request params ---
    const params = { q: sanitizedCity, units: validUnits, appid: apiKey };

    // --- Fetch current weather & forecast in parallel ---
    const [currentRes, forecastRes] = await Promise.all([
      weatherAPI.get("/weather", { params }),
      weatherAPI.get("/forecast", { params }),
    ]);

    // --- Shape & return the response ---
    const current = shapeCurrentWeather(currentRes.data);
    const forecast = aggregateForecast(forecastRes.data.list);

    return res.json({ current, forecast });
  } catch (err) {
    // Map known API/network errors to user-friendly responses
    const mapped = mapWeatherApiError(err);

    // If it's a truly unexpected error, let the global handler log it
    if (mapped.status === 500) {
      return next(err);
    }

    return res.status(mapped.status).json({ error: mapped.message });
  }
});

module.exports = router;
