"use client";

import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  useCallback,
} from "react";

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
    const handleClick = useCallback(
      (event: MouseEvent<HTMLAnchorElement>) => {
        if (stopPropagation) {
          event.stopPropagation();
        }

        if (onClick) {
          onClick(event);
        }
      },
      [onClick, stopPropagation],
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
