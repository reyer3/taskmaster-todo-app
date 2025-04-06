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
        primary: {
          DEFAULT: '#4361ee',
          light: '#5a73f3',
          dark: '#3855d9'
        },
        accent: {
          DEFAULT: '#ff9f1c',
          light: '#ffb347',
          dark: '#f28b00'
        },
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        dark: {
          bg: {
            primary: '#121212',
            secondary: '#1e1e1e',
            tertiary: '#2d2d2d'
          },
          card: '#1e1e1e',
          input: '#2a2a42',
          surface: '#232338',
          text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0'
          },
          border: '#3d3d3d',
          accent: '#6366f1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      maxWidth: {
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'task': '0 2px 5px 0 rgba(0, 0, 0, 0.05)',
        'hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        'dark-task': '0 2px 5px 0 rgba(0, 0, 0, 0.3)',
        'dark-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.3)'
      },
    },
  },
  plugins: [],
}
