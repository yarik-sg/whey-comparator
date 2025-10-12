import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,md,mdx}',
    './docs/**/*.{md,mdx}',
    './frontend/src/**/*.{ts,tsx,mdx,md}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5EB',
          100: '#FFE4CC',
          200: '#FFC999',
          300: '#FFAD66',
          400: '#FF8800',
          500: '#FF6600',
          600: '#E65C00',
          700: '#C85100',
          800: '#A74600',
          900: '#7A3600',
        },
        secondary: {
          50: '#FFF9EB',
          100: '#FFF3D7',
          200: '#FEE7AF',
          300: '#FDDC8E',
          400: '#F0C56B',
          500: '#DCA44A',
        },
        neutral: {
          50: '#F5F5F7',
          100: '#E4E4E8',
          200: '#CFCFD6',
          300: '#B1B1BA',
          400: '#8F8F99',
          500: '#6F6F77',
          600: '#4B4B4B',
          700: '#343438',
          800: '#26262A',
          900: '#1B1B1F',
        },
        accent: {
          50: '#E6FFF3',
          100: '#C5FDE0',
          200: '#93F7C4',
          300: '#5EEEA7',
          400: '#37DE8A',
          500: '#2ECC71',
          600: '#24A85C',
          700: '#1C8348',
          800: '#155F35',
          900: '#0E3D22',
        },
        alert: {
          50: '#FFEDEA',
          100: '#FFD1C9',
          200: '#FFADA1',
          300: '#FF8677',
          400: '#F16050',
          500: '#E74C3C',
          600: '#C53A2D',
          700: '#A22B20',
          800: '#7D1E15',
          900: '#56130D',
        },
        gold: {
          50: '#FFF9F0',
          100: '#FFEED6',
          200: '#FEE2B2',
          300: '#FDD08E',
          400: '#F0B969',
          500: '#D89A40',
        },
      },
      fontFamily: {
        sans: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        aurora: '0 24px 60px -24px rgba(27, 27, 31, 0.35)',
        'aurora-soft': '0 16px 40px -20px rgba(255, 102, 0, 0.25)',
      },
      backgroundImage: {
        'flame-gradient': 'linear-gradient(120deg, #FF6600 0%, #FF8800 100%)',
        'radiant-radial':
          'radial-gradient(circle at 20% 20%, rgba(255, 102, 0, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(253, 220, 142, 0.22), transparent 60%)',
        'midnight-glow':
          'linear-gradient(135deg, rgba(27, 27, 31, 0.98) 0%, rgba(27, 27, 31, 0.94) 55%, rgba(255, 102, 0, 0.28) 100%)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
