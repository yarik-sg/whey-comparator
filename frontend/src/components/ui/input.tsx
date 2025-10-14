"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "flex h-12 w-full rounded-2xl border border-accent/70 bg-accent px-4 py-2 text-sm text-dark shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-dark/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--text)]/25 dark:bg-dark/60 dark:text-[var(--text)] dark:placeholder:text-[var(--text)]/70";

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
