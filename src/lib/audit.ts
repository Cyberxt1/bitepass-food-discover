export type AuditEvent = {
  id: string;
  type:
    | "page_view"
    | "login"
    | "logout"
    | "signup"
    | "profile_update"
    | "order_created"
    | "order_updated"
    | "restaurant_created"
    | "restaurant_updated"
    | "review_created";
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetType?: "user" | "restaurant" | "order" | "review" | "page";
  title: string;
  detail?: string;
  createdAt: string;
};

const KEY = "bitepass:audit-events";
const MAX_EVENTS = 250;

function safeRead(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    window.localStorage.removeItem(KEY);
    return [];
  }
}

function safeWrite(events: AuditEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
}

export function readAuditEvents() {
  return safeRead().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function trackAuditEvent(event: Omit<AuditEvent, "id" | "createdAt"> & { createdAt?: string }) {
  if (typeof window === "undefined") return;
  const createdAt = event.createdAt ?? new Date().toISOString();
  const id = `audit:${event.type}:${event.targetId ?? "general"}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
  safeWrite([{ ...event, id, createdAt }, ...safeRead()]);
}
