export function MealPlaceholder({ name, className = "" }: { name: string; className?: string }) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={`grid place-items-center rounded-xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 text-orange-700 ${className}`}
    >
      <span className="font-black tracking-tight">{initial}</span>
    </div>
  );
}
