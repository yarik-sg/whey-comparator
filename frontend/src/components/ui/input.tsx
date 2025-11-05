"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "flex h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--accent)] px-4 py-2 text-sm text-[color:var(--text)] shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: ClassValue;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(baseStyles, className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
