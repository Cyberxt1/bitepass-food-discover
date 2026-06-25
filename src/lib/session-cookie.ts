const COOKIE_NAME = "bitepass_session";
const SESSION_EXPIRY_KEY = "bitepass:session-expiry";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 2;

function clearSessionExpiry() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_EXPIRY_KEY);
}

function writeSessionExpiry() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + MAX_AGE_SECONDS * 1000));
}

export function hasActiveSession(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(SESSION_EXPIRY_KEY);
  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearSession();
    return false;
  }
  return true;
}

export function readSessionCookie(): string {
  if (typeof document === "undefined") return "";
  if (!hasActiveSession()) return "";
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  clearSessionExpiry();
}

export function writeSessionCookie(value: string): void {
  if (typeof document === "undefined") return;
  if (!value) {
    clearSession();
    return;
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  writeSessionExpiry();
}
