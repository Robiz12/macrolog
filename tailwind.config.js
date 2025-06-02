import { defineConfig } from 'vite'

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
        // Dark theme colors - updated to darker background
        dark: {
          primary: '#0f0f0f',      // Darker background as requested
          secondary: '#1c1c1e',
          tertiary: '#2c2c2e',
          quaternary: '#3a3a3c',
          accent: '#22c55e',       // Changed to green-500
          success: '#30D158',
          warning: '#FF9F0A',
          error: '#FF453A',
          gray: {
            primary: '#ffffff',
            secondary: '#f2f2f7',
            tertiary: '#8e8e93',
            quaternary: '#636366',
          }
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['11px', '13px'],
        'sm': ['13px', '18px'], 
        'base': ['17px', '22px'],
        'lg': ['20px', '25px'],
        'xl': ['22px', '28px'],
        '2xl': ['28px', '34px'],
        '3xl': ['34px', '41px'],
        '4xl': ['40px', '48px'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'apple': '0.75rem',
        'apple-lg': '1rem',
        'apple-xl': '1.25rem',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'apple': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'apple-lg': '0 10px 25px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
        'apple-xl': '0 20px 40px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-green': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '.5',
          },
        },
      },
      backdropBlur: {
        'apple': '20px',
      }
    },
  },
  plugins: [],
} 