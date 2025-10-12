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
        fitidion: {
          orange: '#FF6600',
          gold: '#FDDC8E',
          dark: '#111827',
          light: '#F9FAFB',
        },
        orange: {
          50: '#FFF2E6',
          100: '#FFE0CC',
          200: '#FFC399',
          300: '#FFA066',
          400: '#FF7C33',
          500: '#FF6600',
          600: '#DB5200',
          700: '#B74200',
          800: '#8F3300',
          900: '#662200',
        },
        brand: {
          primary: '#FF6600',
          secondary: '#FDDC8E',
          accent: '#F97316',
          midnight: '#0B1120',
        },
      },
      fontFamily: {
        sans: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        fitidion: '0 24px 60px -24px rgba(17, 24, 39, 0.35)',
        'fitidion-soft': '0 12px 30px -12px rgba(253, 220, 142, 0.35)',
      },
      backgroundImage: {
        'fitidion-radial':
          'radial-gradient(circle at 20% 20%, rgba(255, 102, 0, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(253, 220, 142, 0.18), transparent 60%)',
        'fitidion-hero':
          'linear-gradient(135deg, rgba(15, 24, 39, 0.95) 0%, rgba(255, 102, 0, 0.88) 55%, rgba(253, 220, 142, 0.85) 100%)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        fitidion: "0 24px 60px -24px rgba(27, 27, 31, 0.25)",
        "fitidion-soft": "0 12px 30px -12px rgba(255, 102, 0, 0.18)",
      },
      backgroundImage: {
        "fitidion-radial":
          "radial-gradient(circle at 20% 20%, rgba(255, 102, 0, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 232, 209, 0.22), transparent 60%)",
        "fitidion-hero":
          "linear-gradient(135deg, rgba(27, 27, 31, 0.96) 0%, rgba(255, 102, 0, 0.92) 55%, rgba(255, 232, 209, 0.9) 100%)",
      },
      borderRadius: {
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
