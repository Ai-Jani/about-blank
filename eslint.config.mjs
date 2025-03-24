import eslint from "@eslint/js";

import tseslint from "typescript-eslint";

import {
  dirname,
} from "node:path";

import {
  fileURLToPath,
} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "main.js",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        // tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
