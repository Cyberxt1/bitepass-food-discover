import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ProgressiveItem({
  children,
  className,
  index = 0,
  intrinsicSize = "280px",
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  intrinsicSize?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        rootMargin: "140px 0px",
        threshold: 0.04,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform,filter] duration-500 ease-out motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-y-0 scale-100 opacity-100 blur-0"
          : "translate-y-5 scale-[0.97] opacity-0 blur-[2px]",
        className,
      )}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: intrinsicSize,
        transitionDelay: visible ? `${(index % 6) * 55}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
