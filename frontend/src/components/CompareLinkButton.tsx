"use client";

import {
  type MouseEvent,
  type ReactNode,
  type ButtonHTMLAttributes,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface CompareLinkButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> {
  href: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

export function CompareLinkButton({
  href,
  onClick,
  className,
  children,
  ...props
}: CompareLinkButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
        if (event.defaultPrevented) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();

      router.push(href);
    },
    [href, onClick, router],
  );

  const buttonClassName =
    typeof className === "string" && className.length > 0
      ? className.trim()
      : className;

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
