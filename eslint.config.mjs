import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // ✅ ADD RULES HERE
    rules: {
      "@typescript-eslint/no-explicit-any": "off",      // Allows use of 'any'
      "@typescript-eslint/no-unused-vars": "warn",      // Unused vars become yellow warnings, not red errors
      "react/no-unescaped-entities": "off",             // Allows ' and " in your About Us page
      "react-hooks/exhaustive-deps": "warn",            // Prevents build failure on missing dependencies
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;