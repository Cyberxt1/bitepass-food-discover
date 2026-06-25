import { useEffect, useState } from "react";

export function useRealtimeResource<T>(load: () => Promise<T>, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const next = await load();
        if (cancelled) return;
        setData(next);
        setError(null);
      } catch (caught) {
        if (!cancelled) setError(caught);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, load]);

  return { data, loading, error };
}
