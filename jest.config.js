module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/user_data_handler.js"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
