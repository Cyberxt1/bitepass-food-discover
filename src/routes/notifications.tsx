import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Info, Settings, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const {
    notifications,
    preferences,
    updatePreferences,
    markAllRead,
    markRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
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
              <p className="mt-1 text-sm text-muted-foreground">
                Updates about orders and activity will show here.
              </p>
              <Link
                to="/discover"
                className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Back to app
              </Link>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onRead={() => markRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
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
              <PreferenceRow
                label="In-app alerts"
                checked={preferences.enabled}
                onChange={(enabled) => updatePreferences({ enabled })}
              />
              <PreferenceRow
                label="Order updates"
                checked={preferences.orderUpdates}
                onChange={(orderUpdates) => updatePreferences({ orderUpdates })}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Only order, payment and account alerts are kept here.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: ReturnType<typeof useNotifications>["notifications"][number];
  onRead: () => void;
  onDelete: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-destructive">
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center text-destructive-foreground">
        <Trash2 className="h-5 w-5" />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (dragX === 0) onRead();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onRead();
          if (event.key === "Delete") onDelete();
        }}
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchMove={(event) => {
          if (startX.current === null) return;
          const currentX = event.touches[0]?.clientX ?? startX.current;
          setDragX(Math.max(-110, Math.min(0, currentX - startX.current)));
        }}
        onTouchEnd={(event) => {
          const endX = event.changedTouches[0]?.clientX;
          const distance =
            startX.current !== null && endX !== undefined ? endX - startX.current : dragX;
          if (distance < -72) {
            onDelete();
          } else {
            setDragX(0);
          }
          startX.current = null;
        }}
        className={`relative block w-full border p-4 text-left shadow-soft transition-[transform,background-color] duration-200 ${
          notification.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
        }`}
        style={{ transform: `translateX(${dragX}px)`, touchAction: "pan-y" }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{notification.title}</p>
              {!notification.read && (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNotificationTime(notification.createdAt)}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground sm:hidden">
              Swipe left to delete
            </p>
          </div>
          <button
            type="button"
            aria-label="Delete notification"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive sm:grid"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
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
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
      <span className="text-xs font-bold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}
