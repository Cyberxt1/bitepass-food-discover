import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Receipt, User as UserIcon, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <div>
        <header className="sticky top-0 z-30 glass border-b border-border/40">
          <div className="px-4 py-3"><h1 className="text-base font-bold">Profile</h1></div>
        </header>
        <main className="px-4 pt-4">
          <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted"><UserIcon className="h-6 w-6 text-muted-foreground" /></div>
            <p className="mt-3 text-sm font-semibold">You're not signed in</p>
            <Link to="/login" className="mt-4 inline-block rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const signOut = () => {
    logout();
    notify("success", "Signed out", { id: "signout-success" });
    nav({ to: "/" });
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-3"><h1 className="text-base font-bold">Profile</h1></div>
      </header>

      <main className="px-4 pt-4 lg:mx-auto lg:max-w-6xl lg:pt-8">
        <div className="lg:hidden">
          <MobileProfile user={user} signOut={signOut} />
        </div>
        <div className="hidden lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
          <aside className="space-y-4">
            <div className="rounded-3xl bg-gradient-warm p-6 text-white shadow-glow">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-3xl backdrop-blur">{user.avatar}</div>
              <p className="mt-4 text-xl font-bold">{user.name}</p>
              <p className="text-sm opacity-90">{user.email}</p>
              {user.address && (
                <p className="mt-3 flex items-start gap-2 text-sm opacity-90">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{user.address}</span>
                </p>
              )}
              <span className="mt-4 inline-flex rounded-full bg-white/25 px-3 py-1 text-xs font-semibold uppercase">{user.role}</span>
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-card px-4 py-3.5 text-sm font-medium text-destructive shadow-soft hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DesktopAction to="/orders" icon={<Receipt className="h-5 w-5" />} title="Orders" description="Track current and past orders." />
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <p className="text-lg font-bold">Account details</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoRow label="Full name" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.role} />
                <InfoRow label="Location" value={user.address ?? "No saved location"} />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MobileProfile({
  user,
  signOut,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  signOut: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-warm p-4 text-white shadow-glow">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl backdrop-blur">{user.avatar}</div>
        <div>
          <p className="text-base font-bold">{user.name}</p>
          <p className="text-xs opacity-85">{user.email}</p>
          {user.address && <p className="mt-1 text-[11px] opacity-85">{user.address}</p>}
          <span className="mt-1 inline-block rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase">{user.role}</span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-soft">
        <Link to="/orders" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50">
          <span className="flex items-center gap-3 text-sm font-medium"><Receipt className="h-4 w-4 text-muted-foreground" /> My orders</span>
          <span className="text-muted-foreground">›</span>
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );
}

function DesktopAction({
  to,
  icon,
  title,
  description,
}: {
  to: "/orders";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="rounded-3xl bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="mb-4 inline-flex rounded-2xl bg-muted p-3">{icon}</div>
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

