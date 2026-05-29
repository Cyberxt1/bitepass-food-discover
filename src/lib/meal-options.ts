export type MealOption = {
  id: string;
  name: string;
  price: number;
};

export function parseMealOptions(raw?: string): MealOption[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MealOption[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        id: item.id || "opt" + Math.random().toString(36).slice(2),
        name: item.name,
        price: Number(item.price) || 0,
      }));
  } catch {
    return [];
  }
}

export function stringifyMealOptions(options: MealOption[]): string {
  return JSON.stringify(
    options
      .filter((item) => item.name.trim())
      .map((item) => ({ ...item, name: item.name.trim(), price: Number(item.price) || 0 })),
  );
}
