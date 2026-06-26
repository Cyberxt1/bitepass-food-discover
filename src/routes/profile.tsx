import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Bell,
  Headphones,
  LocateFixed,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
  Receipt,
  Send,
  Share2,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { getDashboardPath, useAuth } from "@/lib/auth";
import { getCurrentLocationDetails, shortLocationLabel } from "@/lib/location";
import { notify, useNotifications } from "@/lib/notifications";
import { useTheme, type Theme } from "@/lib/theme";
import { backend } from "@/lib/backend";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const nav = useNavigate();
  const [locating, setLocating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("general");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup`
      : "https://bitepass.app/signup";
  const inviteMessage = `Join me on BitePass. Order food nearby and skip the waiting: ${inviteUrl}`;
  const whatsappInviteUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

  if (!user) {
    return (
      <div>
        <header className="sticky top-0 z-30 glass border-b border-border/40">
          <div className="px-4 py-3">
            <h1 className="text-base font-bold">Settings</h1>
          </div>
        </header>
        <main className="px-4 pt-4">
          <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
              <UserIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-semibold">You're not signed in</p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      notify("success", "Signed out", { id: "signout-success" });
      nav({ to: "/", replace: true });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Logout failed", {
        id: "signout-error",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const refreshLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const location = await getCurrentLocationDetails();
      await updateProfile({
        address: location.address,
        lat: String(location.lat),
        lng: String(location.lng),
      });
      notify("success", "Location updated", { id: "settings-location-updated" });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Location update failed", {
        id: "settings-location-error",
      });
    } finally {
      setLocating(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      notify("error", "Write a short message first", { id: "settings-feedback-empty" });
      return;
    }
    setSendingFeedback(true);
    try {
      await backend.addFeedback({
        id: "fb" + Date.now(),
        userId: user.id,
        userName: user.name,
        email: user.email,
        category: feedbackCategory,
        message: feedbackMessage.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
        priority:
          feedbackCategory === "payment" || feedbackCategory === "order" ? "urgent" : "normal",
      });
      setFeedbackMessage("");
      setFeedbackCategory("general");
      notify("success", "Feedback sent", { id: "settings-feedback-sent" });
    } catch {
      notify("error", "Feedback could not be sent", { id: "settings-feedback-error" });
    } finally {
      setSendingFeedback(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      notify("success", "Invite link copied", { id: "invite-link-copied" });
    } catch {
      notify("error", "Could not copy invite link", { id: "invite-link-copy-error" });
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-bold">Settings</h1>
            <p className="text-xs text-muted-foreground">Account, theme, location, alerts</p>
          </div>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pt-4 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 lg:pt-8">
        <aside className="space-y-4">
          <section className="rounded-3xl bg-gradient-warm p-5 text-white shadow-glow">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl font-black backdrop-blur">
              {user.avatar}
            </div>
            <p className="mt-4 text-xl font-bold">{user.name}</p>
            <p className="text-sm opacity-90">{user.email}</p>
            <span className="mt-4 inline-flex rounded-full bg-white/25 px-3 py-1 text-xs font-semibold uppercase">
              {user.role}
            </span>
          </section>

          <button
            onClick={() => void signOut()}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-card px-4 py-3.5 text-sm font-medium text-destructive shadow-soft hover:bg-destructive/5 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </aside>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/orders"
              className="rounded-3xl bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-muted p-3">
                <Receipt className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">Orders</p>
              <p className="mt-1 text-sm text-muted-foreground">Track current and past orders.</p>
            </Link>
            <Link
              to="/notifications"
              className="rounded-3xl bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-muted p-3">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">Notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">Review alerts and order updates.</p>
            </Link>
          </div>

          <SettingsCard
            title="Invite a Friend to BitePass!"
            detail="Share BitePass with someone who hates waiting for food too."
          >
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
                  <Share2 className="h-5 w-5" />
                </div>
                <p className="min-w-0 text-sm font-semibold">
                  Bring your friends in and make lunch faster together.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={whatsappInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-4 text-sm font-black text-white transition active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-black transition active:scale-95"
                >
                  Copy link
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Appearance" detail={`Current theme: ${resolvedTheme}`}>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "system"] as Theme[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTheme(item)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold capitalize transition ${
                    theme === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item === "light" && <Sun className="mx-auto mb-1 h-4 w-4" />}
                  {item === "dark" && <Moon className="mx-auto mb-1 h-4 w-4" />}
                  {item === "system" && <Settings className="mx-auto mb-1 h-4 w-4" />}
                  {item}
                </button>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard
            title="Location"
            detail={user.address ? shortLocationLabel(user.address) : "No saved location"}
          >
            <button
              type="button"
              onClick={refreshLocation}
              disabled={locating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-70 sm:w-auto"
            >
              <LocateFixed className="h-4 w-4" />
              {locating ? "Updating location..." : "Use current location"}
            </button>
          </SettingsCard>

          <SettingsCard
            title="Notification Preferences"
            detail="Control what BitePass can alert you about."
          >
            <div className="space-y-2">
              <PreferenceRow
                label="In-app notifications"
                checked={preferences.enabled}
                onChange={(checked) => updatePreferences({ enabled: checked })}
              />
              <PreferenceRow
                label="Order updates"
                checked={preferences.orderUpdates}
                onChange={(checked) => updatePreferences({ orderUpdates: checked })}
              />
              <PreferenceRow
                label="Promos and discounts"
                checked={preferences.promos}
                onChange={(checked) => updatePreferences({ promos: checked })}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="Feedback Hub"
            detail="Contact help, report order issues, or send product feedback."
          >
            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Headphones className="h-5 w-5" />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Messages go straight to the admin feedback inbox.
              </p>
            </div>
            <div className="mt-3 grid gap-2">
              <select
                value={feedbackCategory}
                onChange={(event) => setFeedbackCategory(event.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
              >
                <option value="general">General</option>
                <option value="order">Order help</option>
                <option value="restaurant">Restaurant issue</option>
                <option value="payment">Payment</option>
              </select>
              <textarea
                value={feedbackMessage}
                onChange={(event) => setFeedbackMessage(event.target.value)}
                placeholder="Tell us what happened..."
                rows={3}
                className="resize-none rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={submitFeedback}
                disabled={sendingFeedback}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 text-sm font-black text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
              >
                {sendingFeedback ? (
                  <CheckCircle2 className="h-4 w-4 animate-pulse" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send feedback
              </button>
            </div>
          </SettingsCard>

          <SettingsCard title="Account Details" detail="Your active BitePass profile.">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Full name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Role" value={user.role} />
              <InfoRow label="Location" value={user.address ?? "No saved location"} />
            </div>
          </SettingsCard>
        </section>
      </main>
    </div>
  );
}

function SettingsCard({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-base font-bold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      {children}
    </section>
  );
}

function PreferenceRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-primary"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
