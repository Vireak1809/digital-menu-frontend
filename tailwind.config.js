/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(249,115,22,.6)' },
          '100%': { boxShadow: '0 0 0 12px rgba(249,115,22,0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up .25s ease-out',
        'fade-in': 'fade-in .2s ease-out',
        'pulse-ring': 'pulse-ring 1.4s infinite',
      },
    },
  },
  plugins: [],
};