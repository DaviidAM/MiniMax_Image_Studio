const baseConfig = require("eslint-config-next/core-web-vitals");

module.exports = [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  ...baseConfig,
];
