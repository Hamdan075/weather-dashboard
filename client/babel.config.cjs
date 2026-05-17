/**
 * babel.config.js
 * ---------------
 * Babel configuration for Jest to transform ESM (import/export)
 * and JSX syntax used in the client source files.
 */

module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
