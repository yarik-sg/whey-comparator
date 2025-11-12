"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  useCallback,
} from "react";

import { useAnalytics } from "@/hooks/useAnalytics";
import {
  prepareCompareNavigation,
  type CompareProductPreview,
} from "@/lib/compareNavigation";

interface CompareLinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  stopPropagation?: boolean;
  product?: CompareProductPreview;
}

export const CompareLinkButton = forwardRef<
  HTMLAnchorElement,
  CompareLinkButtonProps
>(
  (
    {
      href,
      stopPropagation = true,
      onClick,
      className,
      children,
      product,
      ...props
    },
    ref,
  ) => {
    const { trackButtonClick } = useAnalytics();
    const router = useRouter();
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

        const isModifiedEvent =
          event.button !== 0
          || event.defaultPrevented
          || event.metaKey
          || event.ctrlKey
          || event.shiftKey
          || event.altKey;

        trackButtonClick({
          action: "compare",
          label: analyticsLabel ?? null,
          context: href,
        });

        if (product && !isModifiedEvent) {
          event.preventDefault();
          prepareCompareNavigation(product);

          if (onClick) {
            onClick(event);
          }

          router.push(href);
          return;
        }

        if (onClick) {
          onClick(event);
        }
      },
      [
        analyticsLabel,
        href,
        onClick,
        product,
        router,
        stopPropagation,
        trackButtonClick,
      ],
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
