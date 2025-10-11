"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-glow hover:bg-primary/90 dark:hover:bg-primary focus-visible:ring-primary/40",
  secondary:
    "bg-secondary text-primary shadow-sm hover:bg-secondary/90 focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-muted hover:bg-accent focus-visible:ring-primary/20",
  outline:
    "border border-primary/20 bg-background text-primary shadow-sm hover:bg-accent focus-visible:ring-primary/20 dark:border-primary/30 dark:bg-dark dark:text-white",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm",
  sm: "h-10 px-4 text-xs uppercase tracking-[0.3em]",
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
