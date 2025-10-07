import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import { useTheme } from './ThemeProvider';

type ThemeToggleProps = {
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({ className = '', onClick, ...props }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    toggleTheme();
    onClick?.(event);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`btn-ghost backdrop-blur-md transition ${className}`.trim()}
      {...props}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/80 shadow-inner shadow-white/30 transition dark:bg-slate-900/50 dark:shadow-slate-950/40">
        {theme === 'dark' ? (
          <svg
            aria-hidden
            className="h-5 w-5 text-amber-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" opacity="0.4" />
            <path d="M12 2a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 17.8a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.2a1 1 0 0 1 1-1Zm10-7.8a1 1 0 0 1-1 1h-1.2a1 1 0 1 1 0-2H21a1 1 0 0 1 1 1ZM5.2 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1.2a1 1 0 0 1 1 1Zm14.45-6.45a1 1 0 0 1 0 1.4l-.84.85a1 1 0 1 1-1.41-1.42l.85-.84a1 1 0 0 1 1.4 0ZM6.6 17.4a1 1 0 0 1 0 1.4l-.85.85a1 1 0 0 1-1.4-1.42l.84-.85a1 1 0 0 1 1.4 0Zm12 0 .84.85a1 1 0 1 1-1.4 1.42l-.85-.85a1 1 0 1 1 1.41-1.42ZM6.6 6.6l-.84-.85a1 1 0 0 1 1.4-1.4l.85.84A1 1 0 0 1 6.6 6.6Z" />
          </svg>
        ) : (
          <svg
            aria-hidden
            className="h-5 w-5 text-sky-500"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
          </svg>
        )}
      </span>
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 sm:inline dark:text-slate-300">
        {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
      </span>
    </button>
  );
}
