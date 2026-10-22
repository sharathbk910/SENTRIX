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
          bg: '#0a0e17',
          surface: '#0f172a',
          card: '#131d33',
          'card-hover': '#182440',
          border: '#1e293b',
          'border-subtle': '#1e293b',
          'border-focus': '#3b82f6',
          primary: '#2563eb',
          'primary-hover': '#1d4ed8',
          cyan: '#0284c7',
          emerald: '#059669',
          rose: '#e11d48',
          amber: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
