import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f6feb',
          foreground: '#ffffff',
          50: '#e8f0ff',
          100: '#d2e1ff',
          200: '#a5c3ff',
          300: '#79a6ff',
          400: '#4c88ff',
          500: '#1f6feb',
          600: '#1958c4',
          700: '#13429d',
          800: '#0d2b75',
          900: '#07154e',
        },
        success: '#1a936f',
        warning: '#f2a007',
        danger: '#d64550',
        slate: {
          950: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 20px 45px -24px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
