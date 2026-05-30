import { cn } from "@/lib/utils";

export function RouteLoadingOverlay({ visible, compact = false }: { visible: boolean; compact?: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-background/35 backdrop-blur-sm transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
        !visible && "hidden",
      )}
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card/80 px-6 py-5 shadow-card">
        <div className={cn("rounded-full border-4 border-primary/20 border-t-primary animate-spin", compact ? "h-9 w-9" : "h-12 w-12")} />
        <p className="text-sm font-semibold text-foreground">Loading</p>
      </div>
    </div>
  );
}
