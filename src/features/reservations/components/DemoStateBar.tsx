import { cn } from "@/lib/utils";
import type { EventStatus } from "../types";

const OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "published", label: "Antes de abrir" },
  { value: "open", label: "Abierto" },
  { value: "closed", label: "Cerrado" },
];

/** Mockup-only control to preview each event state. Not part of the real app. */
export function DemoStateBar({
  value,
  onChange,
}: {
  value: EventStatus;
  onChange: (s: EventStatus) => void;
}) {
  return (
    <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center gap-2 px-5 sm:px-6">
      <span className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
        Vista del mockup:
      </span>
      <div role="radiogroup" aria-label="Estado del evento" className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "border-2 border-wood-dark px-2.5 py-1 font-pixel text-sm transition-colors",
              value === opt.value
                ? "bg-wood-dark text-gold"
                : "bg-cream text-foreground hover:bg-parchment-deep",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
