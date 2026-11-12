/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#07090e',
          900: '#0f131d',
          800: '#181f2e',
          accent: '#f43f5e',
          gold: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
