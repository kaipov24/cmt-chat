import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          green: '#059669',
          ink: '#111827',
        },
      },
    },
  },
  plugins: [],
};

export default config;
