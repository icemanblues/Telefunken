import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

const DOM_TYPES = { NodeListOf: "readonly", NodeList: "readonly" };

export default [
  { ignores: ["node_modules/**", "dist/**"] },
  ...[
    js.configs.recommended,
    {
      files: ["**/*.ts"],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2024,
          sourceType: "module",
        },
        globals: {
          ...globals.browser,
          ...globals.node,
          ...globals.jest,
          ...globals.vitest,
          ...DOM_TYPES,
        },
      },
      rules: {
        "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "no-undef": "off",
        "no-console": "off",
      },
    },
  ],
];
