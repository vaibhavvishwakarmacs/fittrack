/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090a0f', // deepest background
          900: '#10121a', // card background
          850: '#151822', // elevated card / input
          800: '#1c212f', // hover / active border
          700: '#2a3144', // divider
          600: '#3c455c', // muted icon/border
        },
        lime: {
          DEFAULT: '#bbf43d',
          accent: '#bbf43d',
          bright: '#ccff00',
          hover: '#a6de2e',
          light: '#d9f99d',
          dim: 'rgba(187, 244, 61, 0.12)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'lime-sm': '0 0 12px rgba(187, 244, 61, 0.2)',
        'lime-md': '0 0 24px rgba(187, 244, 61, 0.28)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
}
