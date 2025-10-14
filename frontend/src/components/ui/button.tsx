"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary dark:bg-primary-d dark:text-dark dark:hover:bg-primary",
  secondary:
    "bg-secondary text-dark hover:bg-secondary/80 focus-visible:ring-primary/40 dark:bg-[var(--secondary)] dark:text-[var(--text)]",
  ghost:
    "bg-transparent text-dark hover:bg-accent focus-visible:ring-primary/30 dark:text-[var(--text)] dark:hover:bg-[var(--secondary)]/40",
  outline:
    "border border-accent text-dark hover:bg-accent focus-visible:ring-primary dark:border-[var(--text)]/20 dark:text-[var(--text)] dark:hover:bg-[var(--secondary)]/30",
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
  className?: ClassValue;
}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: ClassValue;
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
      if (!React.isValidElement(children)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Button with `asChild` requires a single React element as a child.");
        }
        return null;
      }

      const child = React.Children.only(children) as React.ReactElement;

      return React.cloneElement(child, {
        ref,
        className: cn(mergedClassName, child.props.className),
        ...props,
      });
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
