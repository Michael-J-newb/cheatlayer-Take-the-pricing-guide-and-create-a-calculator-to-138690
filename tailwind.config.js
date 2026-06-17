const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        sv: {
          navy: '#080c18',
          surface: '#0f1729',
          card: '#131c32',
          border: '#1e2d4a',
          gold: '#c9a84c',
          'gold-light': '#e8c876',
          'gold-dark': '#a88a3a',
          silver: '#94a3b8',
          muted: '#3d5166'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.5s ease-out forwards'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
