"use client";

import { type MouseEvent, type ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";

interface CompareLinkButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> {
  href: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function CompareLinkButton({ href, onClick, className = "", ...props }: CompareLinkButtonProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (onClick) {
      onClick(event);
      if (event.defaultPrevented) {
        return;
      }
    }

    router.push(href);
  };

  return (
    <button
      type="button"
      {...props}
      className={`${className}`.trim()}
      onClick={handleClick}
    />
  );
}
