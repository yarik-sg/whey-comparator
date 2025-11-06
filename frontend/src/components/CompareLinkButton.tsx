"use client";

import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  useCallback,
} from "react";

import { useAnalytics } from "@/hooks/useAnalytics";

interface CompareLinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  stopPropagation?: boolean;
}

export const CompareLinkButton = forwardRef<
  HTMLAnchorElement,
  CompareLinkButtonProps
>(
  (
    { href, stopPropagation = true, onClick, className, children, ...props },
    ref,
  ) => {
    const { trackButtonClick } = useAnalytics();
    const analyticsLabel =
      typeof props["aria-label"] === "string"
        ? props["aria-label"]
        : typeof props.title === "string"
          ? props.title
          : undefined;

    const handleClick = useCallback(
      (event: MouseEvent<HTMLAnchorElement>) => {
        if (stopPropagation) {
          event.stopPropagation();
        }

        trackButtonClick({
          action: "compare",
          label: analyticsLabel ?? null,
          context: href,
        });

        if (onClick) {
          onClick(event);
        }
      },
      [analyticsLabel, href, onClick, stopPropagation, trackButtonClick],
    );

    const normalizedClassName =
      typeof className === "string" && className.trim().length > 0
        ? className.trim()
        : className ?? undefined;

    return (
      <Link
        href={href}
        ref={ref}
        className={normalizedClassName}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

CompareLinkButton.displayName = "CompareLinkButton";
