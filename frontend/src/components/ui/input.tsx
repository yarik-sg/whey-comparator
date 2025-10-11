"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "flex h-12 w-full rounded-2xl border border-secondary/70 bg-accent/80 px-4 py-2 text-sm text-dark shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-muted/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary/30 dark:bg-dark/60 dark:text-white dark:placeholder:text-muted";

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
