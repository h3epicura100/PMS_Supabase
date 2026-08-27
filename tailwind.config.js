/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pms: {
          bg: '#F8FAFC',          // slate-50
          surface: '#FFFFFF',     // white
          border: '#E2E8F0',      // slate-200
          text: '#0F172A',        // slate-900
          muted: '#64748B',       // slate-500
          primary: '#1E40AF',     // blue-800
          'primary-hover': '#1E3A8A', // blue-900
          accent: '#3B82F6',      // blue-500
          'accent-hover': '#2563EB', // blue-600
          'accent-light': '#DBEAFE', // blue-100
          success: '#059669',     // emerald-600
          'success-bg': '#D1FAE5',// emerald-100
          warning: '#D97706',     // amber-600
          'warning-bg': '#FEF3C7',// amber-100
          danger: '#DC2626',      // red-600
          'danger-bg': '#FEE2E2', // red-100
          info: '#0EA5E9',        // sky-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
};
