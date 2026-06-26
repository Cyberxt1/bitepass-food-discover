import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Check } from "lucide-react";
import type { Restaurant } from "@/lib/seed";

export function RestaurantCard({
  r,
  distanceLabel,
  compact = false,
  minimal = false,
}: {
  r: Restaurant;
  distanceLabel?: string;
  compact?: boolean;
  minimal?: boolean;
}) {
  const primaryTag =
    r.tags
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .find((tag) => tag.toLowerCase() !== "nigerian") ??
    r.tags
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean)[0];

  if (minimal) {
    return (
      <Link
        to="/restaurant/$restaurantId"
        params={{ restaurantId: r.id }}
        className="group block overflow-hidden rounded-2xl bg-card shadow-soft transition active:scale-[0.98]"
      >
        <div className="relative aspect-[1.35/1] overflow-hidden bg-muted">
          {r.image ? (
            <img
              src={r.image}
              alt={r.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
          {r.verificationStatus === "verified" && (
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-success text-success-foreground shadow-soft">
              <Check className="h-4 w-4" />
            </span>
          )}
          <h3 className="absolute bottom-2 left-3 right-3 line-clamp-2 text-base font-black leading-tight text-white">
            {r.name}
          </h3>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            {primaryTag ? (
              <span className="min-w-0 truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-black text-foreground">
                {primaryTag}
              </span>
            ) : (
              <span />
            )}
            {r.isOpen === "0" ? (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-black text-destructive">
                Closed
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-black text-success">
                Open
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {r.prepTime} min
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{distanceLabel ?? `${r.distance} km`}</span>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/restaurant/$restaurantId"
      params={{ restaurantId: r.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
    >
      {r.image && (
        <div
          className={`relative overflow-hidden bg-muted ${compact ? "aspect-[2/1]" : "aspect-[16/9]"}`}
        >
          <img
            src={r.image}
            alt={r.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent ${compact ? "h-12" : "h-16"}`}
          />
          <p
            className={`absolute left-3 right-3 line-clamp-1 font-black text-white ${compact ? "bottom-2 text-xs" : "bottom-3 text-sm"}`}
          >
            {r.name}
          </p>
        </div>
      )}
      <div className={`relative border-b border-border bg-muted/35 ${compact ? "p-2" : "p-2.5"}`}>
        {!r.image && (
          <p
            className={`line-clamp-2 font-black leading-tight ${compact ? "min-h-8 text-sm" : "min-h-10 text-base"}`}
          >
            {r.name}
          </p>
        )}
        <p
          className={`mt-1 line-clamp-1 text-muted-foreground ${compact ? "text-[11px] leading-4" : "text-xs leading-5"}`}
        >
          {r.description}
        </p>
        <div className={`flex flex-wrap gap-1 ${compact ? "mt-1.5" : "mt-2"}`}>
          {r.tags
            .split("|")
            .filter(Boolean)
            .slice(0, 2)
            .map((t) => (
              <span
                key={t}
                className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground"
              >
                {t}
              </span>
            ))}
        </div>
        {r.isOpen === "0" && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            Closed
          </span>
        )}
      </div>
      <div className={compact ? "p-2" : "p-2.5"}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`line-clamp-1 font-semibold ${compact ? "text-xs" : "text-sm"}`}>
            {r.cuisine}
          </h3>
          <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
            <Star className="h-3 w-3 fill-current" />
            {r.rating}
          </span>
        </div>
        {r.verificationStatus === "verified" && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-black text-success">
            <Check className="h-3 w-3" />
            Verified
          </span>
        )}
        {r.address && (
          <p
            className={`${compact ? "mt-1" : "mt-1.5"} flex items-start gap-1 text-[11px] font-semibold leading-4 text-foreground`}
          >
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span className="line-clamp-1">{r.address}</span>
          </p>
        )}
        <div
          className={`${compact ? "mt-1.5 gap-1.5 text-[10px]" : "mt-2 gap-2 text-[11px]"} flex items-center text-muted-foreground`}
        >
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {r.prepTime} min
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {distanceLabel ?? `${r.distance} km`}
          </span>
          {!compact && <span>{r.reviews} reviews</span>}
        </div>
      </div>
    </Link>
  );
}
