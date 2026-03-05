/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0e9ff', 200: '#c7d7fe', 300: '#a5b9fc',
          400: '#8193f8', 500: '#6470f1', 600: '#5058e5', 700: '#4347ca',
          800: '#383ba3', 900: '#323682',
        },
        surface: {
          50: '#f8f9fc', 100: '#f0f2f8', 200: '#e4e7f0',
          800: '#1a1d2e', 900: '#12141f', 950: '#0c0e18',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      }
    }
  },
  plugins: []
}