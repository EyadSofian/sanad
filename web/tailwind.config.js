/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        night: {
          950: '#070d18',
          900: '#0b1626',
          800: '#101f36',
          700: '#16294a',
          600: '#1e3a5f',
        },
        // Persona chip colors (spec Section 11)
        jarvis: '#d9b64a', // gold
        friday: '#6b9bd1', // steel blue
        tars: '#f59e0b', // amber
        case: '#34a06e', // deep green
        crisis: '#7fb8a4', // calm sage for crisis UI state
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 0.25 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
