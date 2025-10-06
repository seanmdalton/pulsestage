/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Manrope',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        // You can add additional font families if needed:
        // display: ['Manrope', 'sans-serif'], // For headings
        // body: ['Manrope', 'sans-serif'],    // For body text
      },
      colors: {
        // PulseStage Brand Colors
        pulse: {
          dark: '#0B1221', // Dark background
          accent: '#00B3A4', // Accent (pulse)
          'text-light': '#F9FAFB', // Light text
          'text-dark': '#0B1221', // Dark text
          // Extended brand palette for better integration
          'accent-light': '#26C5B8', // Lighter accent variant
          'accent-dark': '#008B7D', // Darker accent variant
          surface: '#1A2332', // Surface color for cards/panels
        },
      },
      backgroundColor: {
        pulse: {
          dark: '#0B1221',
          surface: '#1A2332',
        },
      },
      textColor: {
        pulse: {
          accent: '#00B3A4',
          'text-light': '#F9FAFB',
          'text-dark': '#0B1221',
        },
      },
      borderColor: {
        pulse: {
          accent: '#00B3A4',
          surface: '#1A2332',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
