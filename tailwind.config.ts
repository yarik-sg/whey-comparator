import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,md,mdx}',
    './docs/**/*.{md,mdx}',
    './frontend/src/**/*.{ts,tsx,mdx,md}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        dark: 'rgb(var(--dark-rgb) / <alpha-value>)',
        text: 'rgb(var(--text-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        'fitidion-orange': 'rgb(var(--primary-rgb) / <alpha-value>)',
        'fitidion-dark': 'rgb(var(--dark-rgb) / <alpha-value>)',
        'fitidion-light': 'rgb(var(--background-rgb) / <alpha-value>)',
        'fitidion-gold': 'rgb(253 220 142 / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 24px 60px -24px rgba(255, 102, 0, 0.35)',
        'glow-soft': '0 18px 45px -24px rgba(27, 27, 31, 0.25)',
        fitidion: '0 20px 55px -28px rgba(255, 102, 0, 0.25)',
      },
      backgroundImage: {
        'fitidion-radial':
          'radial-gradient(circle at 20% 20%, rgba(255, 102, 0, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 232, 209, 0.3), transparent 60%)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
