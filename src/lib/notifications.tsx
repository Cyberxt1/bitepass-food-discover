import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

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

const STORAGE_KEY_PREFIX = "bitepass:notifications";
const PREFS_KEY_PREFIX = "bitepass:notification-preferences";
const DEDUPE_WINDOW_MS = 1800;
const MAX_NOTIFICATIONS = 40;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

let notificationsStore: AppNotification[] = [];
let preferencesStore: NotificationPreferences = { enabled: true, orderUpdates: true, promos: true };
let activeScope = "guest";
let loadedScope = "";
const listeners = new Set<() => void>();
const recentEvents = new Map<string, number>();

function storageKey(scope = activeScope) {
  return `${STORAGE_KEY_PREFIX}:${scope}`;
}

function preferencesKey(scope = activeScope) {
  return `${PREFS_KEY_PREFIX}:${scope}`;
}

function emitNotifications() {
  listeners.forEach((listener) => listener());
}

function loadNotifications(scope = activeScope) {
  if (typeof window === "undefined") return;
  if (loadedScope === scope) return;
  loadedScope = scope;
  notificationsStore = [];
  preferencesStore = { enabled: true, orderUpdates: true, promos: true };
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    notificationsStore = raw ? (JSON.parse(raw) as AppNotification[]) : [];
    const rawPrefs = window.localStorage.getItem(preferencesKey(scope));
    preferencesStore = rawPrefs
      ? { ...preferencesStore, ...(JSON.parse(rawPrefs) as Partial<NotificationPreferences>) }
      : preferencesStore;
  } catch {
    notificationsStore = [];
  }
}

function saveNotifications() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(), JSON.stringify(notificationsStore));
}

function savePreferences() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(preferencesKey(), JSON.stringify(preferencesStore));
}

function setNotificationScope(scope: string) {
  if (activeScope === scope && loadedScope === scope) return;
  activeScope = scope;
  loadedScope = "";
  recentEvents.clear();
  loadNotifications(scope);
  emitNotifications();
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
  const eventKey = `${activeScope}:${options.id ?? `${level}:${title}`}`;
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
  const { user, authReady } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(preferencesStore);

  useEffect(() => {
    if (!authReady) return;
    setNotificationScope(user ? user.id : "guest");
  }, [authReady, user?.id]);

  useEffect(() => {
    loadNotifications(activeScope);
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
