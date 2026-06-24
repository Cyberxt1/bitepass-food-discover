import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin } from "lucide-react";
import type { Restaurant } from "@/lib/seed";

export function RestaurantCard({ r, distanceLabel }: { r: Restaurant; distanceLabel?: string }) {
  return (
    <Link
      to="/restaurant/$restaurantId"
      params={{ restaurantId: r.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
    >
      {r.image && (
        <div className="relative aspect-[5/3] overflow-hidden bg-muted">
          <img src={r.image} alt={r.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
          <p className="absolute bottom-3 left-3 right-3 line-clamp-1 text-sm font-black text-white">{r.name}</p>
        </div>
      )}
      <div className="relative border-b border-border bg-muted/35 p-3">
        {!r.image && <p className="line-clamp-2 min-h-10 text-base font-black leading-tight">{r.name}</p>}
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{r.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {r.tags.split("|").filter(Boolean).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">{t}</span>
          ))}
        </div>
        {r.isOpen === "0" && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">Closed</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold">{r.cuisine}</h3>
          <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
            <Star className="h-3 w-3 fill-current" />{r.rating}
          </span>
        </div>
        {r.address && (
          <p className="mt-2 flex items-start gap-1 text-[11px] font-semibold leading-4 text-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span className="line-clamp-2">{r.address}</span>
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.prepTime} min</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{distanceLabel ?? `${r.distance} km`}</span>
          <span>· {r.reviews} reviews</span>
        </div>
      </div>
    </Link>
  );
}
