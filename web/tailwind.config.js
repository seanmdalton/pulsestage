/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // PulseStage Brand Colors
        'pulse': {
          'dark': '#0B1221',      // Dark background
          'accent': '#00B3A4',    // Accent (pulse)
          'text-light': '#F9FAFB', // Light text
          'text-dark': '#0B1221',  // Dark text
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}

