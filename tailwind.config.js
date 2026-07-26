/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgNavy: "#0B1220",
        cardNavy: "#131C2E",
        cardBorder: "#1E2D4A",
        primaryBlue: "#3B82F6",
        successGreen: "#22C55E",
        warningOrange: "#F59E0B",
        dangerRed: "#EF4444",
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
