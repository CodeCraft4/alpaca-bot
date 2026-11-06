/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#BE185D',
          sidebar: '#831843',
          sidebarHover: '#701339',
          sidebarActive: '#FFFFFF',
          accent: '#EC4899',
          bg: '#FFF7FA',
          card: '#FFFFFF',
          border: '#FCE7F3',
          text: '#1F1720',
          muted: '#827581',
          success: '#16A34A',
          danger: '#DC2626',
          subtle: '#FDF2F8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(190, 24, 93, 0.05), 0 1px 2px -1px rgba(190, 24, 93, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(190, 24, 93, 0.08), 0 2px 4px -2px rgba(190, 24, 93, 0.08)',
      }
    },
  },
  plugins: [],
}
