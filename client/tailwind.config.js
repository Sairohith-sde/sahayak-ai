/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        institutional: {
          navy: '#0f172a', // Deep slate navy
          slate: '#334155', // Slate gray
          teal: '#0f766e',  // Muted teal
          lightTeal: '#f0fdfa' // Light pastel teal
        },
        triage: {
          critical: '#b91c1c', // Deep red
          criticalBg: '#fef2f2',
          high: '#d97706',     // Amber
          highBg: '#fffbeb',
          medium: '#ca8a04',   // Muted yellow
          mediumBg: '#fefce8',
          low: '#15803d',      // Muted green
          lowBg: '#f0fdf4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
