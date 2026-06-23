import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Info, Settings, Trash2 } from "lucide-react";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { notifications, preferences, updatePreferences, markAllRead, markRead, clearAll } = useNotifications();
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllRead}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pt-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8 lg:pt-8">
        <section className="space-y-3">
          {notifications.length === 0 ? (
            <div className="grid place-items-center rounded-3xl bg-card px-6 py-16 text-center shadow-soft">
              <Bell className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-base font-semibold">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Updates about orders and activity will show here.</p>
              <Link
                to="/discover"
                className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Back to app
              </Link>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead(notification.id)}
                className={`block w-full rounded-2xl border p-4 text-left shadow-soft transition ${
                  notification.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      {!notification.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{notification.level}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Preferences</h2>
            </div>
            <div className="space-y-2">
              <PreferenceRow label="In-app alerts" checked={preferences.enabled} onChange={(enabled) => updatePreferences({ enabled })} />
              <PreferenceRow label="Order updates" checked={preferences.orderUpdates} onChange={(orderUpdates) => updatePreferences({ orderUpdates })} />
              <PreferenceRow label="Promos" checked={preferences.promos} onChange={(promos) => updatePreferences({ promos })} />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function PreferenceRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
      <span className="text-xs font-bold">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />
    </label>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}
