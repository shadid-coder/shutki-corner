import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1F33',
          900: '#0F2A47',
          800: '#153A5F',
          700: '#1C4A78'
        },
        sea: {
          600: '#1E6E8C',
          500: '#2C89AC',
          400: '#4FA5C4',
          100: '#DCEFF5'
        },
        beige: {
          50: '#FBF7EF',
          100: '#F4EAD8',
          200: '#E9DBC0'
        }
      },
      fontFamily: {
        bengali: ['var(--font-bengali)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};

export default config;
