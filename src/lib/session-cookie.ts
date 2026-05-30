const COOKIE_NAME = "bitepass_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readSessionCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

export function writeSessionCookie(value: string): void {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}
