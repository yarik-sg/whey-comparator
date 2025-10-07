"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

const baseStyles =
  "flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60";

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
