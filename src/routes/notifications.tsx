import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { notifications, markAllRead, markRead, clearAll } = useNotifications();

  return (
    <div>
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold">Notifications</h1>
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

      {notifications.length === 0 ? (
        <main className="grid place-items-center px-6 pt-20 text-center">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-base font-semibold">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Updates about orders and activity will show here.</p>
          <Link
            to="/discover"
            className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Back to app
          </Link>
        </main>
      ) : (
        <main className="space-y-3 px-4 pt-4">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markRead(notification.id)}
              className={`block w-full rounded-2xl border p-4 text-left shadow-soft transition ${
                notification.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</p>
                </div>
                {!notification.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
        </main>
      )}
    </div>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}
