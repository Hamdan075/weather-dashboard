/**
 * jest.config.js
 * --------------
 * Jest configuration for the client-side React tests.
 */

module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  // Ignore CSS imports in tests
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
};
