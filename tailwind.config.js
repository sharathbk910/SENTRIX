/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentrix: {
          bg: '#08080A',
          surface: '#040406',
          panel: '#121317',
          card: '#121317',
          'card-hover': '#17181F',
          border: '#1C1D22',
          'border-subtle': '#1C1D22',
          'border-hover': '#2E3038',
          'border-focus': '#CC9166',
          accent: '#CC9166',
          'accent-hover': '#B87E54',
          'accent-muted': 'rgba(204, 145, 102, 0.12)',
          text: {
            muted: '#9194A1',
            secondary: '#C7C9D1',
            primary: '#E2E3E9',
            white: '#FFFFFF',
          },
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dropdown': '0 8px 24px -4px rgba(0, 0, 0, 0.75)',
        'elevated': '0 12px 32px -6px rgba(0, 0, 0, 0.85)',
      }
    },
  },
  plugins: [],
}
