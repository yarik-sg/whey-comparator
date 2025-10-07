import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '3rem',
        xl: '4rem',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          DEFAULT: '#22c55e',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#ef4444',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
        },
        protein: {
          whey: '#3b82f6',
          casein: '#8b5cf6',
          vegetal: '#16a34a',
          isolate: '#f97316',
        },
        platform: {
          myprotein: '#0071c2',
          prozis: '#cc2b2b',
          amazon: '#ff9900',
          decathlon: '#0082c3',
          nutripure: '#14b8a6',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Montserrat', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      backgroundImage: {
        'athletic-radial':
          'radial-gradient(circle at 0% -10%, rgba(59,130,246,0.3), transparent 55%), radial-gradient(circle at 100% 0%, rgba(34,197,94,0.18), transparent 45%)',
        'athletic-linear': 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(14,165,233,0.85) 50%, rgba(34,197,94,0.9) 100%)',
      },
      boxShadow: {
        athletic: '0 25px 50px -20px rgba(15,23,42,0.25)',
        glow: '0 0 30px rgba(59,130,246,0.45)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.92' },
        },
        glow: {
          '0%': { boxShadow: '0 0 0 rgba(59,130,246,0.0)' },
          '100%': { boxShadow: '0 0 30px rgba(59,130,246,0.55)' },
        },
        'slide-up-fade': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 3.2s ease-in-out infinite',
        glow: 'glow 2.8s ease-in-out infinite alternate',
        'slide-up-fade': 'slide-up-fade 0.6s ease-out both',
      },
      borderRadius: {
        '4xl': '2.5rem',
      },
    },
  },
  plugins: [forms, typography, containerQueries],
};

export default config;
