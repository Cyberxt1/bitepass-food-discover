import { Link } from "@tanstack/react-router";
import { MapPin, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { shortLocationLabel } from "@/lib/location";

export function AppHeader({ subtitle, locationLabel }: { subtitle?: string; locationLabel?: string }) {
  const { user } = useAuth();
  const label = locationLabel ?? (user?.address ? shortLocationLabel(user.address) : "Location off");

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{label}</span>
          </div>
          <div className="text-sm font-semibold">
            {user ? `Hey, ${user.name.split(" ")[0]}` : subtitle ?? "Welcome to BitePass"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/orders" className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition hover:scale-105">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-primary" />
          </Link>
        </div>
      </div>
    </header>
  );
}
