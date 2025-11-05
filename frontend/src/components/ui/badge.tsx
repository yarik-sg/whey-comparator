"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

export type BadgeVariant = "primary" | "secondary" | "accent" | "outline" | "muted";
export type BadgeSize = "sm" | "md";

const baseStyles =
  "inline-flex items-center gap-2 rounded-full font-semibold transition-colors duration-200";

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary text-white shadow-soft",
  secondary: "bg-secondary text-dark",
  accent: "bg-accent text-[color:var(--text)]",
  outline: "border border-[color:var(--border-soft)] text-[color:var(--text)]",
  muted: "bg-[color:var(--surface)] text-[color:var(--muted)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: ClassValue;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "accent", size = "sm", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
