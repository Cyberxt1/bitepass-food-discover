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

export type NotificationPreferences = {
  enabled: boolean;
  orderUpdates: boolean;
  promos: boolean;
};

type NotifyOptions = {
  id?: string;
  persist?: boolean;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  updatePreferences: (patch: Partial<NotificationPreferences>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = "bitepass:notifications";
const PREFS_KEY = "bitepass:notification-preferences";
const DEDUPE_WINDOW_MS = 1800;
const MAX_NOTIFICATIONS = 40;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

let notificationsStore: AppNotification[] = [];
let preferencesStore: NotificationPreferences = { enabled: true, orderUpdates: true, promos: true };
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
    const rawPrefs = window.localStorage.getItem(PREFS_KEY);
    preferencesStore = rawPrefs
      ? { ...preferencesStore, ...(JSON.parse(rawPrefs) as Partial<NotificationPreferences>) }
      : preferencesStore;
  } catch {
    notificationsStore = [];
  }
}

function saveNotifications() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsStore));
}

function savePreferences() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferencesStore));
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
  loadNotifications();
  if (!preferencesStore.enabled) return;
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
  const [preferences, setPreferences] = useState<NotificationPreferences>(preferencesStore);

  useEffect(() => {
    loadNotifications();
    const sync = () => {
      setNotifications([...notificationsStore]);
      setPreferences({ ...preferencesStore });
    };
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      preferences,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      updatePreferences: (patch) => {
        preferencesStore = { ...preferencesStore, ...patch };
        savePreferences();
        emitNotifications();
      },
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
    [notifications, preferences],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}
