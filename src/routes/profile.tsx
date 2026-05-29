import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Sun, BarChart3, Receipt, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="px-4 py-3"><h1 className="text-base font-bold">Profile</h1></div>
      </header>

      <main className="px-4 pt-4">
        {!user ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted"><UserIcon className="h-6 w-6 text-muted-foreground" /></div>
            <p className="mt-3 text-sm font-semibold">You're not signed in</p>
            <Link to="/login" className="mt-4 inline-block rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-warm p-4 text-white shadow-glow">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl backdrop-blur">{user.avatar}</div>
              <div>
                <p className="text-base font-bold">{user.name}</p>
                <p className="text-xs opacity-85">{user.email}</p>
                {user.address && <p className="text-xs opacity-85">{user.address}</p>}
                <span className="mt-1 inline-block rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase">{user.role}</span>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-soft">
              <Link to="/orders" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50">
                <span className="flex items-center gap-3 text-sm font-medium"><Receipt className="h-4 w-4 text-muted-foreground" /> My orders</span>
                <span className="text-muted-foreground">›</span>
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="flex items-center justify-between border-t border-border px-4 py-3.5 hover:bg-muted/50">
                  <span className="flex items-center gap-3 text-sm font-medium"><BarChart3 className="h-4 w-4 text-muted-foreground" /> Admin dashboard</span>
                  <span className="text-muted-foreground">›</span>
                </Link>
              )}
              <button onClick={toggle} className="flex w-full items-center justify-between border-t border-border px-4 py-3.5 hover:bg-muted/50">
                <span className="flex items-center gap-3 text-sm font-medium">
                  {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
              </button>
              <button onClick={() => { logout(); toast.success("Signed out"); nav({ to: "/" }); }}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/5">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
