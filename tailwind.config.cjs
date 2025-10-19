module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          50: '#f0fdf9',
          100: '#c7f9e6',
          300: '#2dd4bf',
          500: '#06b6d4',
          700: '#0ea5b8'
        },
        cyber: {
          500: '#7c3aed',
          400: '#8b5cf6',
          300: '#a78bfa'
        }
      },
      boxShadow: {
        'neon-sm': '0 6px 18px rgba(124,58,237,0.12)',
        'neon-lg': '0 20px 50px rgba(6,182,212,0.12)'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI']
      }
    }
  },
  plugins: []
}