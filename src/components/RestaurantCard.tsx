import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin } from "lucide-react";
import type { Restaurant } from "@/lib/seed";

export function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <Link
      to="/restaurant/$restaurantId"
      params={{ restaurantId: r.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative h-36 overflow-hidden bg-muted">
        <img src={r.image} alt={r.name} loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 flex gap-1">
          {r.tags.split("|").slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-foreground">{t}</span>
          ))}
        </div>
        {r.isOpen === "0" && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">Closed</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold">{r.name}</h3>
          <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
            <Star className="h-3 w-3 fill-current" />{r.rating}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{r.cuisine}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.prepTime} min</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.distance} km</span>
          <span>· {r.reviews} reviews</span>
        </div>
      </div>
    </Link>
  );
}
