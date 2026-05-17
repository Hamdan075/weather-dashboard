/**
 * Loader.jsx
 * ----------
 * Animated weather-themed loading indicator.
 * Three bouncing dots with a pulsing cloud icon.
 */

export default function Loader() {
  return (
    <div className="loader" id="loader" role="status" aria-label="Loading weather data">
      {/* Cloud SVG */}
      <svg
        className="loader__cloud"
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>

      <div className="loader__dots">
        <span className="loader__dot" />
        <span className="loader__dot" />
        <span className="loader__dot" />
      </div>

      <p className="loader__text">Fetching weather data…</p>
    </div>
  );
}
