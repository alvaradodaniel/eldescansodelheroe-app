import { cn } from "@/lib/utils";

interface SeatPipsProps {
  capacity: number;
  taken: number;
  /** Highlight this seat index (0-based) as the player's own seat. */
  highlight?: number;
  className?: string;
}

/** Pixel squares, one per seat: filled = taken, hollow = free. */
export function SeatPips({ capacity, taken, highlight, className }: SeatPipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} aria-hidden>
      {Array.from({ length: capacity }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-4 border-2 border-wood-dark",
            i < taken ? "bg-wood" : "bg-cream",
            highlight === i && "bg-gold shadow-glow",
          )}
        />
      ))}
    </div>
  );
}
