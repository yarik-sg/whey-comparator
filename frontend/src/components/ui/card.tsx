"use client";

import * as React from "react";

import { cn, type ClassValue } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: ClassValue;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 text-[color:var(--text)] shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-strong dark:border-[color:var(--border-soft)]/80 dark:bg-[color:var(--surface)]/90",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1.5", className)} {...props} />
);

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-xl font-semibold text-[color:var(--text)]", className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted", className)} {...props} />
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-4 space-y-4", className)} {...props} />
);

export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 pt-4", className)} {...props} />
);
