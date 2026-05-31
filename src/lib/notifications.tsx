import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type NotificationLevel = "success" | "error" | "info";

export type AppNotification = {
  id: string;
  title: string;
  level: NotificationLevel;
  createdAt: string;
  read: boolean;
};

type NotifyOptions = {
  id?: string;
  persist?: boolean;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = "bitepass:notifications";
const DEDUPE_WINDOW_MS = 1800;
const MAX_NOTIFICATIONS = 40;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

let notificationsStore: AppNotification[] = [];
let hasLoadedStore = false;
const listeners = new Set<() => void>();
const recentEvents = new Map<string, number>();

function emitNotifications() {
  listeners.forEach((listener) => listener());
}

function loadNotifications() {
  if (hasLoadedStore || typeof window === "undefined") return;
  hasLoadedStore = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    notificationsStore = raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    notificationsStore = [];
  }
}

function saveNotifications() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsStore));
}

function pushNotification(notification: AppNotification) {
  loadNotifications();
  notificationsStore = [notification, ...notificationsStore].slice(0, MAX_NOTIFICATIONS);
  saveNotifications();
  emitNotifications();
}

function shouldSuppress(eventKey: string) {
  const now = Date.now();
  const lastSeen = recentEvents.get(eventKey) ?? 0;
  recentEvents.set(eventKey, now);
  return now - lastSeen < DEDUPE_WINDOW_MS;
}

export function notify(level: NotificationLevel, title: string, options: NotifyOptions = {}) {
  const eventKey = options.id ?? `${level}:${title}`;
  if (shouldSuppress(eventKey)) return;

  const toastId = `toast:${eventKey}`;
  if (level === "success") toast.success(title, { id: toastId, duration: 2200 });
  if (level === "error") toast.error(title, { id: toastId, duration: 2600 });
  if (level === "info") toast.info(title, { id: toastId, duration: 2200 });

  if (options.persist !== false) {
    pushNotification({
      id: `notification:${Date.now()}:${eventKey}`,
      title,
      level,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    loadNotifications();
    const sync = () => setNotifications([...notificationsStore]);
    sync();
    listeners.add(sync);
    return () => listeners.delete(sync);
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      markAllRead: () => {
        notificationsStore = notificationsStore.map((notification) => ({ ...notification, read: true }));
        saveNotifications();
        emitNotifications();
      },
      markRead: (id: string) => {
        notificationsStore = notificationsStore.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        );
        saveNotifications();
        emitNotifications();
      },
      clearAll: () => {
        notificationsStore = [];
        saveNotifications();
        emitNotifications();
      },
    }),
    [notifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}
