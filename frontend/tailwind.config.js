/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'theme-dark': '#121212',
          'theme-dark-lighter': '#1e1e1e',
          'theme-primary': '#6200ee',
          'theme-primary-variant': '#3700b3',
          'theme-secondary': '#03dac6',
          'theme-secondary-variant': '#018786',
        },
        spacing: {
          '72': '18rem',
          '84': '21rem',
          '96': '24rem',
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in forwards',
          'fade-out': 'fadeOut 0.5s ease-out forwards',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          fadeOut: {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' },
          },
        },
      },
    },
    plugins: [],
  }