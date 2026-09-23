import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/.pnpm-store/**",
      "next-env.d.ts",
      "dist/**",
      "coverage/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
