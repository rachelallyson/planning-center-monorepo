import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.next/**",
      "**/build/**",
      "**/docs/out/**",
      "**/docs/next-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    rules: {
      "complexity": ["error", { "max": 5 }],
      "@typescript-eslint/no-inferrable-types": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression",
          message: "Type assertions with 'as' are not allowed. Prefer type guards, generics, or properly typed values.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            any: { message: "Avoid 'any'; use a more specific type." },
            unknown: { message: "Avoid 'unknown'; use a more specific type." },
          },
        },
      ],
      // Use unused-imports plugin for both; base rules off to avoid duplicate reports
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Unused imports: error; auto-removed with `eslint --fix` (npm run lint:fix)
      "unused-imports/no-unused-imports": "error",
      // Unused variables/args: error; remove them (no _ escape hatch)
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "all",
        },
      ],
    },
  },
  // Scripts that run in browser context (e.g. Vertex export) need document/window
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  }
);
