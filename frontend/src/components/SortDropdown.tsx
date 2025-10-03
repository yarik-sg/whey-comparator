"use client";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating", label: "Meilleure note" },
  { value: "protein_ratio", label: "Protéines/€" },
];

export function SortDropdown({ value, onChange, disabled = false }: SortDropdownProps) {
  return (
    <label className="flex flex-col gap-2 text-xs text-gray-400">
      Tri
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[180px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
