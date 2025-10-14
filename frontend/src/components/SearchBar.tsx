"use client";

import { FormEvent } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSuggestionSelect?: (value: string) => void;
}

export function SearchBar({
  value,
  placeholder = "Rechercher un produit, un gym, un programme…",
  suggestions = [],
  isLoading = false,
  className,
  onChange,
  onSubmit,
  onSuggestionSelect,
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-2xl flex-col gap-4 rounded-[2.75rem] border border-white/70 bg-white/95 p-4 shadow-neo transition focus-within:border-primary/40 focus-within:shadow-lg dark:border-white/10 dark:bg-[rgba(15,23,42,0.92)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="fitidion-search" className="sr-only">
          Recherche de produits et compléments
        </label>
        <div className="relative flex w-full items-center">
          <Search className="pointer-events-none absolute left-5 h-5 w-5 text-primary" aria-hidden="true" />
          <Input
            id="fitidion-search"
            name="query"
            type="search"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="h-14 w-full rounded-full border-none bg-transparent pl-14 pr-4 text-base text-dark placeholder:text-dark/60 focus-visible:ring-0 dark:text-white dark:placeholder:text-text-2"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="inline-flex h-14 min-w-[160px] items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-white shadow-lg transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-transparent"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Chargement…
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" aria-hidden="true" />
              Rechercher
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Recherches suggérées">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                onChange(suggestion);
                onSuggestionSelect?.(suggestion);
              }}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[rgba(148,163,184,0.2)] dark:text-text-1 dark:hover:bg-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
