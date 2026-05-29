import { Crosshair, MapPin, Navigation } from "lucide-react";
import type { Coordinates } from "@/lib/location";

export function LocationPreview({
  coords,
  address,
  emptyText = "No restaurant location pinned yet.",
}: {
  coords?: Coordinates | null;
  address?: string;
  emptyText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,var(--color-muted)_0%,var(--color-muted)_45%,var(--color-background)_45%,var(--color-background)_55%,var(--color-muted)_55%,var(--color-muted)_100%)]">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-border" />
          <div className="absolute left-[18%] top-0 h-full w-3 rotate-12 bg-background/80" />
          <div className="absolute right-[16%] top-0 h-full w-2 -rotate-12 bg-background/80" />
          <div className="absolute left-0 top-[22%] h-2 w-full rotate-[-8deg] bg-background/80" />
          <div className="absolute left-0 bottom-[18%] h-3 w-full rotate-6 bg-background/80" />
        </div>

        {coords ? (
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-primary/15">
              <span className="absolute h-14 w-14 rounded-full border border-primary/35" />
              <span className="absolute h-28 w-28 rounded-full border border-primary/15" />
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                <MapPin className="h-5 w-5 fill-current" />
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <Crosshair className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{emptyText}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{address ?? "The precise pinned address will appear here."}</span>
        </div>
        {coords && (
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-muted px-3 py-2">
              <span className="block text-muted-foreground">Latitude</span>
              <span className="font-mono font-bold">{coords.lat.toFixed(6)}</span>
            </div>
            <div className="rounded-xl bg-muted px-3 py-2">
              <span className="block text-muted-foreground">Longitude</span>
              <span className="font-mono font-bold">{coords.lng.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
