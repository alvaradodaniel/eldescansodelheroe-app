import { useEffect, useState } from "react";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    días: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    min: Math.floor((total % 3600) / 60),
    seg: total % 60,
  };
}

export function Countdown({ targetAt }: { targetAt: Date }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = targetAt.getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetAt]);

  const parts = split(remaining ?? Math.max(0, targetAt.getTime() - Date.now()));

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
