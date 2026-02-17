/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores da identidade visual
        'dark-bg': '#1F1F1F',
        'card-bg': '#2C2C2C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#BDBDBD',
        // Estados do pedido
        'status-novo': '#F2994A',
        'status-preparacao': '#F2C94C',
        'status-pronto': '#27AE60',
        'status-cancelado': '#EB5757',
      }
    },
  },
  plugins: [],
}
