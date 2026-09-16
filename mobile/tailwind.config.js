/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D4ED8',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E3A8A',
          900: '#172554',
        },
        surface: {
          DEFAULT: '#F0F2F5',
          card:    '#FFFFFF',
          dark:    '#0F1117',
          'dark-card': '#1C1F27',
        },
        ink: {
          DEFAULT: '#13151A',
          2: '#4B5563',
          3: '#9CA3AF',
          dark:    '#F1F3F7',
          'dark-2': '#9CA3AF',
          'dark-3': '#6B7280',
        },
      },
      fontFamily: {
        arabic: ['NotoSansArabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
