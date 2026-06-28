// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      "import/no-unresolved": "off",
      "import/no-named-as-default": "off",
    }
  },
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*", "jest.setup.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  }
]);
