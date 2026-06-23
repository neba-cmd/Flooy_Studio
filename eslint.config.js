const nextConfig = require("eslint-config-next");

module.exports = [
  ...nextConfig,
  {
    ignores: [".next/", "node_modules/"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
];
