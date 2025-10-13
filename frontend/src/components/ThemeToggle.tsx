"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Basculer le thème"
        className="rounded-full border border-transparent text-muted hover:border-fitidion-orange/30 hover:bg-fitidion-orange/10"
      >
        <SunMedium className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      className="rounded-full border border-transparent text-muted transition hover:border-fitidion-orange/30 hover:bg-fitidion-orange/10"
    >
      {isDark ? (
        <SunMedium className="h-4 w-4" aria-hidden="true" />
      ) : (
        <MoonStar className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
