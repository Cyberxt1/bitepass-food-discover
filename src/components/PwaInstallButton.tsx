import { Download, Share, X } from "lucide-react";
import { useState } from "react";

import { usePwaInstall } from "@/lib/pwa";
import { cn } from "@/lib/utils";

export function PwaInstallButton({
  className,
  label = "Install app",
}: {
  className?: string;
  label?: string;
}) {
  const { canInstall, install, isIos } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!canInstall) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isIos) {
            setShowIosHelp(true);
            return;
          }
          void install();
        }}
        className={cn("inline-flex items-center justify-center gap-2", className)}
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {showIosHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-bitepass-title"
          className="fixed inset-0 z-[100] grid place-items-end bg-black/50 p-3 sm:place-items-center"
        >
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="install-bitepass-title" className="text-lg font-black">
                  Install BitePass
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">On iPhone or iPad:</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                aria-label="Close install instructions"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-black text-primary">
                  1
                </span>
                Open this page in Safari.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-black text-primary">
                  2
                </span>
                Tap the <Share className="inline h-4 w-4 text-primary" /> Share button.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-black text-primary">
                  3
                </span>
                Choose “Add to Home Screen”.
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
