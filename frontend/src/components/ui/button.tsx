"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-400 focus-visible:ring-orange-400 focus-visible:ring-offset-white shadow-sm",
  secondary:
    "bg-orange-100 text-orange-700 hover:bg-orange-200 focus-visible:ring-orange-200 focus-visible:ring-offset-white",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-orange-200 focus-visible:ring-offset-white",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-orange-50 focus-visible:ring-orange-200 focus-visible:ring-offset-white",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm", // default
  sm: "h-10 px-4 text-sm",
  lg: "h-14 px-8 text-base",
  icon: "h-10 w-10", // square
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
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, className })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
