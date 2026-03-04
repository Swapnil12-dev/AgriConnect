/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agriDark: '#0d110a',
        agriCard: '#151a13',
        agriGreen: '#4ade80',
        agriText: '#f3f4f6',
      }
    },
  },
  plugins: [],
}