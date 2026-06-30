import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['apps/frontend/**/*.{ts,tsx,js,jsx}', 'src/app/**/*.{ts,tsx,js,jsx}', 'next.config.ts'],
    ...nextPlugin.flatConfig.recommended,
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx,js,jsx}', 'src/app/**/*.{ts,tsx,js,jsx}', 'next.config.ts'],
    ...nextPlugin.flatConfig.coreWebVitals,
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.mjs',
            '*.config.ts',
            'apps/frontend/postcss.config.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
);
