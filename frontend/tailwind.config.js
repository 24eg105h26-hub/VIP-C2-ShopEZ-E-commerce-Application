/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports class-based dark mode
  theme: {
    extend: {
      colors: {
        premium: {
          dark: '#0B0F19',
          card: '#151D30',
          border: '#23304E',
          accent: '#C5A880', // Premium Gold Accent
          gold: '#C5A880'
        },
        brand: {
          light: '#F8F9FA',
          dark: '#0A0A0A',
          primary: '#1A1A1A',
          secondary: '#C5A880'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
