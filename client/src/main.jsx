/**
 * main.jsx
 * --------
 * Entry point for the React application.
 * Mounts <App /> into the root DOM node.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
