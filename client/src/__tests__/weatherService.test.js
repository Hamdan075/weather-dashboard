/**
 * weatherService.test.js
 * ======================
 * Unit tests for the frontend weather service:
 *
 *   6. buildUrl()            — URL construction with query encoding
 *   7. resolveErrorMessage() — error → user-friendly string
 *   8. fetchWeather()        — full fetch lifecycle with mocked global fetch
 *
 * Each function is tested for normal, edge, and invalid cases.
 */

import { buildUrl, resolveErrorMessage, fetchWeather } from "../services/weatherService";

// ═══════════════════════════════════════════════════════════════
// 6. buildUrl
// ═══════════════════════════════════════════════════════════════

describe("buildUrl()", () => {
  // --- Normal cases ---
  test("builds a URL with path and query params", () => {
    const result = buildUrl("/weather", { city: "London", units: "metric" });
    expect(result).toBe("/api/weather?city=London&units=metric");
  });

  test("encodes special characters in param values", () => {
    const result = buildUrl("/weather", { city: "New York" });
    expect(result).toBe("/api/weather?city=New%20York");
  });

  test("encodes ampersands and equals in param values", () => {
    const result = buildUrl("/weather", { city: "A&B=C" });
    expect(result).toContain("city=A%26B%3DC");
  });

  // --- Edge cases ---
  test("returns path only when params is empty", () => {
    const result = buildUrl("/weather", {});
    expect(result).toBe("/api/weather");
  });

  test("returns path only when params is omitted", () => {
    const result = buildUrl("/health");
    expect(result).toBe("/api/health");
  });

  test("handles single param correctly", () => {
    const result = buildUrl("/test", { key: "value" });
    expect(result).toBe("/api/test?key=value");
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. resolveErrorMessage
// ═══════════════════════════════════════════════════════════════

describe("resolveErrorMessage()", () => {
  // --- Normal cases: server error in body ---
  test("returns body.error when present", () => {
    const body = { error: "City not found." };
    const result = resolveErrorMessage(new Error(), undefined, body);
    expect(result).toBe("City not found.");
  });

  test("prioritises body.error over other error types", () => {
    const err = new TypeError("network fail");
    const body = { error: "Server says: bad request" };
    const result = resolveErrorMessage(err, undefined, body);
    expect(result).toBe("Server says: bad request");
  });

  // --- AbortError (timeout) ---
  test("returns timeout message for AbortError", () => {
    const err = new DOMException("The operation was aborted.", "AbortError");
    const result = resolveErrorMessage(err, undefined, undefined);
    expect(result).toContain("timed out");
  });

  // --- TypeError (network failure) ---
  test("returns network error message for TypeError", () => {
    const err = new TypeError("Failed to fetch");
    const result = resolveErrorMessage(err, undefined, undefined);
    expect(result).toContain("Unable to reach the server");
  });

  // --- Edge / invalid cases ---
  test("returns fallback message for generic Error", () => {
    const err = new Error("something random");
    const result = resolveErrorMessage(err, undefined, undefined);
    expect(result).toContain("Something went wrong");
  });

  test("returns fallback for null error", () => {
    const result = resolveErrorMessage(null, undefined, undefined);
    expect(result).toContain("Something went wrong");
  });

  test("returns fallback for undefined body", () => {
    const err = new Error("oops");
    const result = resolveErrorMessage(err, undefined, undefined);
    expect(result).toBe("Something went wrong. Please try again.");
  });

  test("handles body with no error property", () => {
    const body = { data: "something" };
    const err = new Error("oops");
    const result = resolveErrorMessage(err, undefined, body);
    expect(result).toContain("Something went wrong");
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. fetchWeather (integration with mocked global fetch)
// ═══════════════════════════════════════════════════════════════

describe("fetchWeather()", () => {
  const mockSuccessData = {
    current: { city: "London", temp: 18 },
    forecast: [{ date: "2026-05-17", tempMax: 20, tempMin: 14 }],
  };

  beforeEach(() => {
    // Reset the global fetch mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Normal case ---
  test("returns data on successful fetch", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessData,
    });

    const result = await fetchWeather("London", "metric");

    expect(result).toEqual(mockSuccessData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("calls the correct URL with encoded city and units", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessData,
    });

    await fetchWeather("New York", "imperial");

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("city=New%20York");
    expect(calledUrl).toContain("units=imperial");
  });

  test("defaults to metric units when not provided", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessData,
    });

    await fetchWeather("Tokyo");

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("units=metric");
  });

  // --- Error cases ---
  test("throws user-friendly error when server returns error JSON", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "City not found." }),
    });

    await expect(fetchWeather("Fakecity")).rejects.toThrow("City not found.");
  });

  test("throws network error when fetch itself rejects (TypeError)", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(fetchWeather("London")).rejects.toThrow(
      "Unable to reach the server"
    );
  });

  test("throws timeout message when request is aborted", async () => {
    global.fetch.mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError")
    );

    await expect(fetchWeather("London")).rejects.toThrow("timed out");
  });

  test("throws fallback message for unknown errors", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}), // no error property
    });

    await expect(fetchWeather("London")).rejects.toThrow(
      "Something went wrong"
    );
  });

  // --- Edge case: passes AbortSignal to fetch ---
  test("passes an AbortSignal to the fetch call", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessData,
    });

    await fetchWeather("London");

    const fetchOptions = global.fetch.mock.calls[0][1];
    expect(fetchOptions).toHaveProperty("signal");
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
  });
});
