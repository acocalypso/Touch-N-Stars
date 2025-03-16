/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Aktiviert den Dark Mode
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px', // Fügt eine "xs"-Breakpoint für 480px hinzu
      },
    },
  },
  plugins: [],
};
