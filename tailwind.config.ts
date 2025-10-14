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
        primary: '#FF6600',
        secondary: '#FFE8D1',
        accent: '#FFF5EB',
        background: '#FFFFFF',
        surface: '#F4F4F5',
        dark: '#1B1B1F',
        text: '#222222',
        'bg-dark': '#0A0F1F',
        'bg-card': '#1E293B',
        'text-1': '#F1F5F9',
        'text-2': '#CBD5E1',
        'primary-d': '#FF944D',
        'accent-d': '#334155',
        // Legacy aliases kept for backwards compatibility during the refactor.
        'fitidion-orange': '#FF6600',
        'fitidion-dark': '#1B1B1F',
        'fitidion-light': '#FFFFFF',
        'fitidion-gold': '#FFE8D1',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 24px 60px -24px rgba(255, 102, 0, 0.35)',
        'glow-soft': '0 18px 45px -24px rgba(27, 27, 31, 0.25)',
        fitidion: '0 20px 55px -28px rgba(255, 102, 0, 0.25)',
        neo: '0 10px 25px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
      },
      backgroundImage: {
        'fitidion-radial':
          'radial-gradient(circle at 20% 20%, rgba(255, 102, 0, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 232, 209, 0.3), transparent 60%)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 36s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
