import * as React from "react";

import { cn } from "@/lib/utils";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  disabled = false,
  className,
}: SliderProps) {
  const [currentMin, currentMax] = value;
  const safeMin = Math.min(currentMin, currentMax);
  const safeMax = Math.max(currentMin, currentMax);

  const range = Math.max(max - min, 1);
  const startPercent = ((safeMin - min) / range) * 100;
  const endPercent = ((safeMax - min) / range) * 100;

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    onValueChange([Math.min(next, safeMax), safeMax]);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    onValueChange([safeMin, Math.max(next, safeMin)]);
  };

  const trackStyles = cn(
    "pointer-events-none absolute inset-x-0 h-0 w-full appearance-none focus:outline-none",
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
    "[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-300",
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
    "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
    "[&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-slate-300",
  );

  return (
    <div className={cn("relative flex h-10 items-center", disabled && "opacity-60", className)}>
      <div className="absolute left-0 right-0 h-1 rounded-full bg-white/30 dark:bg-white/10" />
      <div
        className="absolute h-1 rounded-full bg-fitidion-orange shadow-glow"
        style={{ left: `${startPercent}%`, width: `${Math.max(endPercent - startPercent, 0)}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMin}
        onChange={handleMinChange}
        disabled={disabled}
        className={trackStyles}
        aria-label="Filtre prix minimum"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMax}
        onChange={handleMaxChange}
        disabled={disabled}
        className={trackStyles}
        aria-label="Filtre prix maximum"
      />
    </div>
  );
}
