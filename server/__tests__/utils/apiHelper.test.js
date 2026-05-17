/**
 * apiHelper.test.js
 * =================
 * Unit tests for the four pure utility functions exported from apiHelper.js:
 *
 *   1. normalizeUnits()     — input validation / normalisation
 *   2. shapeCurrentWeather() — raw API data → clean object
 *   3. aggregateForecast()   — 3-hour list → daily summaries
 *   4. mapWeatherApiError()  — error → user-friendly { status, message }
 *
 * Each function is tested for normal, edge, and invalid input cases.
 */



const {
  normalizeUnits,
  shapeCurrentWeather,
  aggregateForecast,
  mapWeatherApiError,
} = require("../../utils/apiHelper");

// ═══════════════════════════════════════════════════════════════
// 1. normalizeUnits
// ═══════════════════════════════════════════════════════════════

describe("normalizeUnits()", () => {
  // --- Normal cases ---
  test("returns 'metric' for input 'metric'", () => {
    expect(normalizeUnits("metric")).toBe("metric");
  });

  test("returns 'imperial' for input 'imperial'", () => {
    expect(normalizeUnits("imperial")).toBe("imperial");
  });

  // --- Edge cases ---
  test("handles uppercase input 'METRIC'", () => {
    expect(normalizeUnits("METRIC")).toBe("metric");
  });

  test("handles mixed case 'Imperial'", () => {
    expect(normalizeUnits("Imperial")).toBe("imperial");
  });

  test("trims whitespace around valid input", () => {
    expect(normalizeUnits("  metric  ")).toBe("metric");
  });

  // --- Invalid cases ---
  test("returns 'metric' for unsupported unit 'kelvin'", () => {
    expect(normalizeUnits("kelvin")).toBe("metric");
  });

  test("returns 'metric' for empty string", () => {
    expect(normalizeUnits("")).toBe("metric");
  });

  test("returns 'metric' for null input", () => {
    expect(normalizeUnits(null)).toBe("metric");
  });

  test("returns 'metric' for undefined input", () => {
    expect(normalizeUnits(undefined)).toBe("metric");
  });

  test("returns 'metric' for numeric input", () => {
    expect(normalizeUnits(123)).toBe("metric");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. shapeCurrentWeather
// ═══════════════════════════════════════════════════════════════

describe("shapeCurrentWeather()", () => {
  /** A realistic raw response from OpenWeather /weather */
  const fullRaw = {
    name: "London",
    sys: { country: "GB" },
    main: { temp: 18.72, feels_like: 17.3, humidity: 65 },
    wind: { speed: 4.12 },
    weather: [{ description: "light rain", icon: "10d" }],
  };

  // --- Normal case ---
  test("correctly shapes a complete API response", () => {
    const result = shapeCurrentWeather(fullRaw);

    expect(result).toEqual({
      city: "London",
      country: "GB",
      temp: 19,            // rounded from 18.72
      feelsLike: 17,       // rounded from 17.3
      humidity: 65,
      windSpeed: 4.12,
      description: "light rain",
      icon: "10d",
    });
  });

  test("rounds temperature values to nearest integer", () => {
    const raw = { ...fullRaw, main: { temp: 22.5, feels_like: 21.49 } };
    const result = shapeCurrentWeather(raw);
    expect(result.temp).toBe(23);       // Math.round(22.5) = 23
    expect(result.feelsLike).toBe(21);  // Math.round(21.49) = 21
  });

  // --- Edge cases ---
  test("handles missing `sys.country` gracefully", () => {
    const raw = { ...fullRaw, sys: {} };
    const result = shapeCurrentWeather(raw);
    expect(result.country).toBe("—");
  });

  test("handles empty weather array gracefully", () => {
    const raw = { ...fullRaw, weather: [] };
    const result = shapeCurrentWeather(raw);
    expect(result.description).toBe("N/A");
    expect(result.icon).toBe("01d");
  });

  // --- Invalid / missing data ---
  test("handles null `main` with zero fallbacks", () => {
    const raw = { ...fullRaw, main: null };
    const result = shapeCurrentWeather(raw);
    expect(result.temp).toBe(0);
    expect(result.feelsLike).toBe(0);
    expect(result.humidity).toBe(0);
  });

  test("handles null `wind` with zero fallback", () => {
    const raw = { ...fullRaw, wind: null };
    const result = shapeCurrentWeather(raw);
    expect(result.windSpeed).toBe(0);
  });

  test("handles undefined `weather` with safe fallbacks", () => {
    const raw = { ...fullRaw, weather: undefined };
    const result = shapeCurrentWeather(raw);
    expect(result.description).toBe("N/A");
    expect(result.icon).toBe("01d");
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. aggregateForecast
// ═══════════════════════════════════════════════════════════════

describe("aggregateForecast()", () => {
  /**
   * Helper: build a fake forecast entry matching OpenWeather's shape.
   * @param {string} date - "YYYY-MM-DD"
   * @param {string} time - "HH:MM:SS"
   * @param {number} temp
   * @param {string} icon
   * @param {string} desc
   */
  const entry = (date, time, temp, icon = "01d", desc = "clear sky") => ({
    dt_txt: `${date} ${time}`,
    main: { temp },
    weather: [{ icon, description: desc }],
  });

  // --- Normal case: multiple days, multiple entries per day ---
  test("aggregates multiple entries per day into daily summaries", () => {
    const list = [
      entry("2026-05-17", "06:00:00", 15, "02d", "few clouds"),
      entry("2026-05-17", "12:00:00", 22, "01d", "clear sky"),
      entry("2026-05-17", "18:00:00", 18, "03d", "scattered clouds"),
      entry("2026-05-18", "06:00:00", 12, "10d", "light rain"),
      entry("2026-05-18", "12:00:00", 17, "09d", "shower rain"),
    ];

    const result = aggregateForecast(list);

    expect(result).toHaveLength(2);
    // Day 1: min 15, max 22
    expect(result[0]).toMatchObject({
      date: "2026-05-17",
      tempMin: 15,
      tempMax: 22,
    });
    // Day 2: min 12, max 17
    expect(result[1]).toMatchObject({
      date: "2026-05-18",
      tempMin: 12,
      tempMax: 17,
    });
  });

  test("picks the midday icon and description", () => {
    const list = [
      entry("2026-05-17", "06:00:00", 15, "02d", "few clouds"),
      entry("2026-05-17", "12:00:00", 22, "01d", "clear sky"),
      entry("2026-05-17", "18:00:00", 18, "03d", "scattered clouds"),
    ];

    const result = aggregateForecast(list);
    // Mid index of 3 items = floor(3/2) = 1 → index 1
    expect(result[0].icon).toBe("01d");
    expect(result[0].description).toBe("clear sky");
  });

  test("caps output at 5 days even if more are provided", () => {
    const list = [];
    for (let d = 17; d <= 24; d++) {
      list.push(entry(`2026-05-${d}`, "12:00:00", 20));
    }
    const result = aggregateForecast(list);
    expect(result).toHaveLength(5);
  });

  test("sorts days chronologically", () => {
    const list = [
      entry("2026-05-19", "12:00:00", 20),
      entry("2026-05-17", "12:00:00", 18),
      entry("2026-05-18", "12:00:00", 19),
    ];
    const result = aggregateForecast(list);
    expect(result.map((d) => d.date)).toEqual([
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
    ]);
  });

  // --- Edge cases ---
  test("returns empty array for empty list", () => {
    expect(aggregateForecast([])).toEqual([]);
  });

  test("returns empty array for null input", () => {
    expect(aggregateForecast(null)).toEqual([]);
  });

  test("returns empty array for undefined input", () => {
    expect(aggregateForecast(undefined)).toEqual([]);
  });

  test("skips entries with missing dt_txt", () => {
    const list = [
      { main: { temp: 20 }, weather: [{ icon: "01d", description: "clear" }] },
      entry("2026-05-17", "12:00:00", 22),
    ];
    const result = aggregateForecast(list);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-05-17");
  });

  // --- Invalid data ---
  test("handles entries with missing main.temp gracefully", () => {
    const list = [
      { dt_txt: "2026-05-17 12:00:00", weather: [{ icon: "01d", description: "clear" }] },
    ];
    const result = aggregateForecast(list);
    expect(result[0].tempMin).toBe(0);
    expect(result[0].tempMax).toBe(0);
  });

  test("returns 'N/A' description when weather data is missing", () => {
    const list = [
      { dt_txt: "2026-05-17 12:00:00", main: { temp: 20 } },
    ];
    const result = aggregateForecast(list);
    expect(result[0].description).toBe("N/A");
    expect(result[0].icon).toBe("01d");
  });

  test("handles non-array input gracefully", () => {
    expect(aggregateForecast("not an array")).toEqual([]);
    expect(aggregateForecast(42)).toEqual([]);
    expect(aggregateForecast({})).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. mapWeatherApiError
// ═══════════════════════════════════════════════════════════════

describe("mapWeatherApiError()", () => {
  // --- Normal cases: HTTP error responses ---
  test("maps 404 to status 404 with 'City not found' message", () => {
    const err = { response: { status: 404 } };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(404);
    expect(result.message).toContain("City not found");
  });

  test("maps 401 to status 502 with 'Invalid API key' message", () => {
    const err = { response: { status: 401 } };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(502);
    expect(result.message).toContain("Invalid API key");
  });

  test("maps 429 to status 429 with rate-limit message", () => {
    const err = { response: { status: 429 } };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(429);
    expect(result.message).toContain("Too many requests");
  });

  test("maps unknown HTTP status (e.g. 503) to generic 502 message", () => {
    const err = { response: { status: 503 } };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(502);
    expect(result.message).toContain("try again later");
  });

  // --- Network errors ---
  test("maps ECONNABORTED (timeout) to 504", () => {
    const err = { code: "ECONNABORTED" };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(504);
    expect(result.message).toContain("timed out");
  });

  test("maps ERR_NETWORK to 504", () => {
    const err = { code: "ERR_NETWORK" };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(504);
    expect(result.message).toContain("unreachable");
  });

  test("maps ENOTFOUND (DNS failure) to 504", () => {
    const err = { code: "ENOTFOUND" };
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(504);
    expect(result.message).toContain("unreachable");
  });

  // --- Edge / invalid cases ---
  test("maps completely unknown error to 500", () => {
    const err = new Error("Something weird happened");
    const result = mapWeatherApiError(err);
    expect(result.status).toBe(500);
    expect(result.message).toContain("unexpected");
  });

  test("maps empty error object to 500", () => {
    const result = mapWeatherApiError({});
    expect(result.status).toBe(500);
  });
});
