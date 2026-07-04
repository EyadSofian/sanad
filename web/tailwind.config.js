/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Alexandria', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Alexandria', 'Rubik', 'system-ui', 'sans-serif'],
      },
      // "Nature Distilled" light theme — sand, palm, clay. No dark mode by design.
      colors: {
        sand: {
          50: '#FBF7EF',
          100: '#F5EDDE',
          200: '#EBDFC8',
          300: '#DCCCA9',
          400: '#C4AE83',
        },
        ink: {
          DEFAULT: '#2C2721',
          soft: '#6B6252',
          faint: '#94886F',
        },
        palm: {
          DEFAULT: '#1F6B52',
          deep: '#175540',
          tint: '#E1EFE7',
        },
        clay: {
          DEFAULT: '#B04E2E',
          deep: '#8F3E24',
          tint: '#F7E5DC',
        },
        // Persona accents (spec Section 11) tuned for light surfaces
        jarvis: { DEFAULT: '#8A6A1E', tint: '#F4EAD1' },
        friday: { DEFAULT: '#33627F', tint: '#E2EDF4' },
        tars: { DEFAULT: '#A85A16', tint: '#F8E8D4' },
        case: { DEFAULT: '#1F6A4A', tint: '#E1EFE7' },
        crisis: { DEFAULT: '#41586A', tint: '#E8EEF3' },
      },
      boxShadow: {
        card: '0 2px 10px -4px rgba(44, 39, 33, 0.10)',
        warm: '0 10px 30px -12px rgba(44, 39, 33, 0.16)',
        lift: '0 16px 40px -16px rgba(44, 39, 33, 0.22)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 0.25 },
          '50%': { opacity: 1 },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.55 },
          '50%': { transform: 'scale(1.06)', opacity: 0.85 },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(14px, -16px)' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.2s ease-in-out infinite',
        breathe: 'breathe 7s ease-in-out infinite',
        drift: 'drift 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
