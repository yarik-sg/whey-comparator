import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    './index.html',
    './src/**/*.{ts,tsx,md,mdx}',
    './docs/**/*.{md,mdx}',
    './frontend/src/**/*.{ts,tsx,mdx,md}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6600",
        secondary: "#FFE8D1",
        accent: "#FFF5EB",
        dark: "#1B1B1F",
        text: "#222222",
        background: "#FFFFFF",
        muted: "#5F6368",
        surface: "#FFFAF3",
        fitidion: {
          orange: "#FF6600",
          gold: "#FFE8D1",
          dark: "#1B1B1F",
          light: "#FFFFFF",
          accent: "#FFF5EB",
        },
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
