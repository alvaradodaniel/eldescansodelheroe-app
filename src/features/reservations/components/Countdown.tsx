import { useEffect, useState } from "react";

/** Illustrative offset for the mockup: opening happens ~1 day 3 h from now. */
const DEMO_OFFSET_MS = ((27 * 60 + 14) * 60 + 37) * 1000;

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    días: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    min: Math.floor((total % 3600) / 60),
    seg: total % 60,
  };
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.now() + DEMO_OFFSET_MS;
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = split(remaining ?? DEMO_OFFSET_MS);

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-live="off">
      {Object.entries(parts).map(([label, value]) => (
        <div key={label} className="wood-panel pixel-frame px-1 py-3 text-center">
          <span className="block font-pixel text-3xl leading-none text-gold tabular-nums sm:text-5xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1.5 block font-pixel text-xs uppercase tracking-widest text-cream/80">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
