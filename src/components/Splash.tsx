import { useEffect, useState } from "react";

export function Splash({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 1400);
    const t2 = setTimeout(onDone, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-gradient-warm transition-opacity duration-500 ${hide ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/splash-logo.jpg"
          alt="BitePass"
          className="w-72 max-w-[78vw] rounded-3xl shadow-glow"
        />
        <p className="text-sm font-semibold text-white/85">Skip the line. Taste the city.</p>
      </div>
    </div>
  );
}
