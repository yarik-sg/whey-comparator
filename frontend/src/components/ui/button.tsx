"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-soft";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-strong hover:bg-[color:var(--primary-strong)] dark:text-[color:#050505] dark:hover:bg-[color:var(--primary)]",
  secondary:
    "bg-secondary text-dark hover:bg-secondary/85 focus-visible:ring-[color:var(--ring)]/60 dark:bg-[color:var(--secondary)]/80 dark:text-[var(--text)]",
  ghost:
    "bg-transparent text-dark hover:bg-accent focus-visible:ring-[color:var(--ring)]/50 dark:text-[var(--text)] dark:hover:bg-[color:var(--secondary)]/30",
  outline:
    "border border-[color:var(--border-soft)] text-dark hover:border-primary hover:bg-accent focus-visible:ring-[color:var(--ring)] dark:border-[color:var(--border-soft)]/80 dark:text-[var(--text)] dark:hover:bg-[color:var(--secondary)]/35",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm",
  sm: "h-10 px-4 text-sm",
  lg: "h-14 px-8 text-base",
  icon: "h-10 w-10",
};

export function buttonClassName({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      type = "button",
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const mergedClassName = buttonClassName({ variant, size, className });

    if (asChild) {
      return (
        <Slot ref={ref} className={mergedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={mergedClassName}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
