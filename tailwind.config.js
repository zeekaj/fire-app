/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FIRE App Brand Colors (Fixed Light Theme)
        background: '#F9FAFB',
        card: '#FFFFFF',
        text: '#0F1115',
        muted: '#4B5563',
        primary: {
          DEFAULT: '#E4572E',
          hover: '#CC4E29',
        },
        accent: '#2E86AB',
        success: '#2BB673',
        warning: '#F2C14E',
        danger: '#D64550',
      },
      borderRadius: {
        DEFAULT: '14px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'card': '20px',
        'card-lg': '24px',
      },
    },
  },
  plugins: [],
}
