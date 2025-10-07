export type ClassValue = string | number | null | false | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((value) => {
      if (!value && value !== 0) {
        return [];
      }

      if (typeof value === "number") {
        return String(value);
      }

      if (typeof value === "string") {
        return value.split(" ").filter(Boolean);
      }

      return [];
    })
    .filter(Boolean)
    .join(" ");
}
