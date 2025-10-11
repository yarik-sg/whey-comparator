"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "flex h-12 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-2 text-sm text-fitidion-dark shadow-sm backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fitidion-orange/40 focus-visible:ring-offset-0 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-400/80";

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
