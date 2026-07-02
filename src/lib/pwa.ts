import { useSyncExternalStore } from "react";

type InstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emitChange();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emitChange();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCanInstall() {
  return deferredPrompt !== null;
}

function getServerCanInstall() {
  return false;
}

export function isRunningAsPwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function usePwaInstall() {
  const canPrompt = useSyncExternalStore(subscribe, getCanInstall, getServerCanInstall);
  const isStandalone = isRunningAsPwa();
  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !isStandalone;

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    emitChange();
    return choice.outcome === "accepted";
  };

  return {
    canInstall: !isStandalone && (canPrompt || isIos),
    isIos,
    install,
  };
}
