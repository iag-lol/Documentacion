/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        exito: '#16a34a',
        alerta: '#f97316',
        error: '#dc2626'
      }
    }
  },
  plugins: []
};
