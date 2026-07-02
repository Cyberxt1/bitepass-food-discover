import { Link } from "@tanstack/react-router";
import { MapPin, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { shortLocationLabel } from "@/lib/location";
import { useNotifications } from "@/lib/notifications";

export function AppHeader({
  subtitle,
  locationLabel,
  showNotifications = true,
}: {
  subtitle?: string;
  locationLabel?: string;
  showNotifications?: boolean;
}) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const label =
    locationLabel ?? (user?.address ? shortLocationLabel(user.address) : "Location off");

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/brand-logo.png" alt="" className="h-9 w-9 shrink-0 object-contain lg:hidden" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{label}</span>
            </div>
            <div className="truncate text-sm font-semibold lg:text-base">
              {user ? `Hey, ${user.name.split(" ")[0]}` : (subtitle ?? "Welcome to BitePass")}
            </div>
          </div>
        </div>
        {showNotifications && (
          <Link
            to="/notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition hover:scale-105"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
