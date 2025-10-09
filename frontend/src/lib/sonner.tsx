"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastPayload {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();
let toastCounter = 0;

function notifyListeners(payload: ToastPayload) {
  listeners.forEach((listener) => listener(payload));
}

function pushToast(type: ToastType, message: string, duration = 4000) {
  const id = ++toastCounter;
  notifyListeners({ id, type, message, duration });
}

export const toast = {
  success(message: string) {
    pushToast("success", message);
  },
  error(message: string) {
    pushToast("error", message);
  },
  info(message: string) {
    pushToast("info", message);
  },
  warning(message: string) {
    pushToast("warning", message);
  },
};

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  richColors?: boolean;
}

function positionClasses(position: ToasterProps["position"]) {
  switch (position) {
    case "top-left":
      return "left-4 top-4";
    case "bottom-right":
      return "bottom-4 right-4";
    case "bottom-left":
      return "bottom-4 left-4";
    case "top-right":
    default:
      return "right-4 top-4";
  }
}

function toastColors(type: ToastType, richColors: boolean | undefined) {
  if (!richColors) {
    return "bg-slate-900/90 text-slate-50";
  }
  switch (type) {
    case "success":
      return "bg-emerald-500 text-white";
    case "error":
      return "bg-red-500 text-white";
    case "warning":
      return "bg-amber-500 text-white";
    case "info":
    default:
      return "bg-blue-500 text-white";
  }
}

export function Toaster({ position = "top-right", richColors = true }: ToasterProps = {}) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function handle(payload: ToastPayload) {
      setToasts((current) => [...current, payload]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toastItem) => toastItem.id !== payload.id));
      }, payload.duration);
    }

    listeners.add(handle);
    return () => {
      listeners.delete(handle);
    };
  }, []);

  const container = useMemo(() => {
    if (toasts.length === 0) {
      return null;
    }

    return (
      <div className={`pointer-events-none fixed z-[9999] space-y-3 ${positionClasses(position)}`}>
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto min-w-[240px] rounded-2xl px-4 py-3 text-sm shadow-lg transition ${toastColors(
              item.type,
              richColors,
            )}`}
          >
            {item.message}
          </div>
        ))}
      </div>
    );
  }, [position, richColors, toasts]);

  if (!container) {
    return null;
  }

  return createPortal(container, typeof document !== "undefined" ? document.body : ({} as HTMLElement));
}
