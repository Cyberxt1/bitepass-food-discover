import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";

export function Splash({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHide(true), 1400);
    const t2 = setTimeout(onDone, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-gradient-warm transition-opacity duration-500 ${hide ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span className="absolute inset-0 animate-pulse-ring rounded-full" />
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/95 shadow-glow">
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">BitePass</h1>
          <p className="mt-1 text-sm text-white/85">Skip the line. Taste the city.</p>
        </div>
      </div>
    </div>
  );
}
