/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(15, 23, 42, 0.4)',
          border: {
            light: 'rgba(255, 255, 255, 0.2)',
            dark: 'rgba(255, 255, 255, 0.1)',
          },
          shadow: {
            light: 'rgba(0, 0, 0, 0.1)',
            dark: 'rgba(0, 0, 0, 0.3)',
          }
        },
        primary: {
          light: '#667eea',
          dark: '#0f172a',
        },
        ios: {
          blue: '#007AFF',
          gray: '#8E8E93',
          background: '#F2F2F7',
        }
      },
      backdropBlur: {
        glass: '20px',
        light: '10px',
      },
      borderRadius: {
        glass: '20px',
        sm: '12px',
        lg: '24px',
      },
      fontFamily: {
        ios: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'glass-hover': 'all 0.3s ease',
      }
    },
  },
  plugins: [],
}
