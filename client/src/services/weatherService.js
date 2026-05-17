/**
 * weatherService.js
 * -----------------
 * Service layer for communicating with the Express backend.
 * Centralises all API calls so components stay clean.
 *
 * In development, Vite proxies /api/* to http://localhost:5000.
 * In production, the same origin serves both frontend and API.
 */

/**
 * API base URL:
 *   - In development: empty string → relative "/api" paths are proxied by Vite
 *   - In production : set VITE_API_URL to the Render backend URL
 *                     e.g. "https://weather-dashboard-api-xxxx.onrender.com"
 */
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

/** Timeout (ms) after which we abort a request that hasn't responded */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Build a full API URL with encoded query parameters.
 *
 * @param {string} path  — endpoint path, e.g. "/weather"
 * @param {Object} params — key/value pairs to add as query string
 * @returns {string}
 */
function buildUrl(path, params = {}) {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${API_BASE}${path}${query ? `?${query}` : ""}`;
}

/**
 * Determine a user-friendly error message from a failed fetch.
 *
 * @param {Error}    err — the caught error
 * @param {Response} res — the fetch Response (may be undefined)
 * @param {Object}   body — parsed JSON body (may be undefined)
 * @returns {string}
 */
function resolveErrorMessage(err, res, body) {
  // Server returned an error JSON with a message
  if (body?.error) return body.error;

  // Request was aborted by our timeout controller
  if (err?.name === "AbortError") {
    return "The request timed out. Please check your connection and try again.";
  }

  // Network-level failure (backend down, offline, CORS, etc.)
  if (err instanceof TypeError) {
    return "Unable to reach the server. Is the backend running?";
  }

  // Fallback
  return "Something went wrong. Please try again.";
}

/**
 * Fetch current weather + 5-day forecast for a city.
 *
 * @param {string} city  — city name (e.g. "London")
 * @param {string} units — "metric" | "imperial"
 * @returns {Promise<{ current: Object, forecast: Array }>}
 * @throws {Error} with a user-friendly message on failure
 */
// Export helpers for unit testing
export { buildUrl, resolveErrorMessage };

export async function fetchWeather(city, units = "metric") {
  // Set up an AbortController so we can enforce a client-side timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  let body;

  try {
    const url = buildUrl("/weather", { city, units });

    res = await fetch(url, { signal: controller.signal });
    body = await res.json();

    if (!res.ok) {
      throw new Error(body?.error || "Something went wrong.");
    }

    return body; // { current, forecast }
  } catch (err) {
    throw new Error(resolveErrorMessage(err, res, body), { cause: err });
  } finally {
    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}
