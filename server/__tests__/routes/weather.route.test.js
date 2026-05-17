/**
 * weather.route.test.js
 * =====================
 * Integration tests for GET /api/weather using supertest.
 *
 * Tests the 5th function: the Express route handler itself.
 * We mock the Axios weatherAPI so no real HTTP calls are made.
 *
 * Covers:
 *   - Input validation (missing / empty city)
 *   - Successful response shaping
 *   - Missing API key guard
 *   - Upstream error forwarding (404, 401, network)
 */


const request = require("supertest");



const { weatherAPI } = require("../../utils/apiHelper");

// Set a valid API key in env for most tests
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(weatherAPI, "get");
  process.env = { ...ORIGINAL_ENV, OPENWEATHER_API_KEY: "test_api_key_12345" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// Lazy-require app so env + mocks are set first
let app;
beforeAll(() => {
  app = require("../../index");
});

// --- Sample API responses ---
const sampleCurrentResponse = {
  data: {
    name: "Tokyo",
    sys: { country: "JP" },
    main: { temp: 25.6, feels_like: 24.1, humidity: 70 },
    wind: { speed: 3.5 },
    weather: [{ description: "overcast clouds", icon: "04d" }],
  },
};

const sampleForecastResponse = {
  data: {
    list: [
      {
        dt_txt: "2026-05-17 12:00:00",
        main: { temp: 26 },
        weather: [{ icon: "04d", description: "overcast clouds" }],
      },
      {
        dt_txt: "2026-05-18 12:00:00",
        main: { temp: 22 },
        weather: [{ icon: "10d", description: "light rain" }],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. GET /api/weather — route handler
// ═══════════════════════════════════════════════════════════════

describe("GET /api/weather", () => {
  // --- Input validation ---
  test("returns 400 when city query param is missing", async () => {
    const res = await request(app).get("/api/weather");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("City name is required");
  });

  test("returns 400 when city is an empty string", async () => {
    const res = await request(app).get("/api/weather?city=");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("City name is required");
  });

  test("returns 400 when city is only whitespace", async () => {
    const res = await request(app).get("/api/weather?city=%20%20%20");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("City name is required");
  });

  // --- API key guard ---
  test("returns 503 when API key is the placeholder value", async () => {
    process.env.OPENWEATHER_API_KEY = "your_api_key_here";
    const res = await request(app).get("/api/weather?city=London");
    expect(res.status).toBe(503);
    expect(res.body.error).toContain("not configured");
  });

  test("returns 503 when API key is missing entirely", async () => {
    delete process.env.OPENWEATHER_API_KEY;
    const res = await request(app).get("/api/weather?city=London");
    expect(res.status).toBe(503);
    expect(res.body.error).toContain("not configured");
  });

  // --- Successful response ---
  test("returns 200 with shaped current + forecast data for valid city", async () => {
    weatherAPI.get
      .mockResolvedValueOnce(sampleCurrentResponse)   // /weather
      .mockResolvedValueOnce(sampleForecastResponse);  // /forecast

    const res = await request(app).get("/api/weather?city=Tokyo");

    expect(res.status).toBe(200);

    // Current weather
    expect(res.body.current).toMatchObject({
      city: "Tokyo",
      country: "JP",
      temp: 26,         // Math.round(25.6)
      humidity: 70,
      description: "overcast clouds",
    });

    // Forecast
    expect(res.body.forecast).toHaveLength(2);
    expect(res.body.forecast[0].date).toBe("2026-05-17");
    expect(res.body.forecast[1].date).toBe("2026-05-18");
  });

  test("defaults to metric units when not specified", async () => {
    weatherAPI.get
      .mockResolvedValueOnce(sampleCurrentResponse)
      .mockResolvedValueOnce(sampleForecastResponse);

    await request(app).get("/api/weather?city=Tokyo");

    // Check that the Axios call received units=metric
    expect(weatherAPI.get).toHaveBeenCalledWith(
      "/weather",
      expect.objectContaining({
        params: expect.objectContaining({ units: "metric" }),
      })
    );
  });

  test("passes imperial units when specified", async () => {
    weatherAPI.get
      .mockResolvedValueOnce(sampleCurrentResponse)
      .mockResolvedValueOnce(sampleForecastResponse);

    await request(app).get("/api/weather?city=Tokyo&units=imperial");

    expect(weatherAPI.get).toHaveBeenCalledWith(
      "/weather",
      expect.objectContaining({
        params: expect.objectContaining({ units: "imperial" }),
      })
    );
  });

  // --- Upstream error handling ---
  test("returns 404 when upstream API returns 404 (city not found)", async () => {
    weatherAPI.get.mockRejectedValueOnce({ response: { status: 404 } });

    const res = await request(app).get("/api/weather?city=Fakecityxyz");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("City not found");
  });

  test("returns 502 when upstream API returns 401 (bad key)", async () => {
    weatherAPI.get.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app).get("/api/weather?city=London");
    expect(res.status).toBe(502);
    expect(res.body.error).toContain("Invalid API key");
  });

  test("returns 504 when upstream times out (ECONNABORTED)", async () => {
    weatherAPI.get.mockRejectedValueOnce({ code: "ECONNABORTED" });

    const res = await request(app).get("/api/weather?city=London");
    expect(res.status).toBe(504);
    expect(res.body.error).toContain("timed out");
  });

  test("returns 429 when upstream rate-limits us", async () => {
    weatherAPI.get.mockRejectedValueOnce({ response: { status: 429 } });

    const res = await request(app).get("/api/weather?city=London");
    expect(res.status).toBe(429);
    expect(res.body.error).toContain("Too many requests");
  });
});

// ═══════════════════════════════════════════════════════════════
// Bonus: GET /api/health — health check endpoint
// ═══════════════════════════════════════════════════════════════

describe("GET /api/health", () => {
  test("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
  });
});
