export function MealPlaceholder({
  name,
  className = "",
  showInitial = true,
}: {
  name: string;
  className?: string;
  showInitial?: boolean;
}) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={`grid place-items-center rounded-xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200 text-orange-700 ${className}`}
    >
      {showInitial ? <span className="font-black tracking-tight">{initial}</span> : <span className="h-8 w-8 rounded-full bg-orange-300/60" />}
    </div>
  );
}
