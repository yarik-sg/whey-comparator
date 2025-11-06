"use client";

import { useCallback, type AnchorHTMLAttributes, type MouseEvent } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  analyticsAction?: string;
  analyticsLabel?: string;
  analyticsMetadata?: Record<string, unknown>;
}

export function AnalyticsLink({
  analyticsAction = "click",
  analyticsLabel,
  analyticsMetadata,
  onClick,
  href,
  ...rest
}: AnalyticsLinkProps) {
  const { trackButtonClick } = useAnalytics();

  const derivedLabel =
    analyticsLabel ??
    (typeof rest["aria-label"] === "string" ? rest["aria-label"] : undefined) ??
    (typeof rest.title === "string" ? rest.title : undefined) ??
    null;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      trackButtonClick({
        action: analyticsAction,
        label: derivedLabel,
        context: typeof href === "string" ? href : null,
        metadata: analyticsMetadata ?? null,
      });

      if (onClick) {
        onClick(event);
      }
    },
    [analyticsAction, analyticsMetadata, derivedLabel, href, onClick, trackButtonClick],
  );

  return <a {...rest} href={href} onClick={handleClick} />;
}
