export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
      <div className="h-36 w-full bg-muted animate-shimmer" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 rounded bg-muted animate-shimmer" />
        <div className="h-3 w-1/2 rounded bg-muted animate-shimmer" />
      </div>
    </div>
  );
}
