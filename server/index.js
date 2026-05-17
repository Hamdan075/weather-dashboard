/**
 * index.js — Weather Dashboard Backend
 * =====================================
 * Express server that proxies requests to the OpenWeatherMap API.
 * Keeps the API key secure on the server side.
 *
 * Usage:
 *   1. Copy .env.example → .env and add your OpenWeather API key.
 *   2. npm install
 *   3. npm run dev   (development with auto-reload)
 *      npm start     (production)
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const weatherRoutes = require("./routes/weather");

const app = express();
module.exports = app; // Export for supertest (before listen)
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// In production, restrict CORS to the frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET"],
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Request logging (lightweight) ---
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Routes ---
app.use("/api/weather", weatherRoutes);

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

// --- Start server (only when run directly, not when imported by tests) ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`⛅  Weather Dashboard API running on http://localhost:${PORT}`);
  });
}
