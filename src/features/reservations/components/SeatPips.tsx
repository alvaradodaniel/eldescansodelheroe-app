import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";

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
      {Array.from({ length: Math.min(capacity, 24) }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex size-7 items-center justify-center border-2 border-wood-dark",
            i < taken ? "bg-wood text-cream" : "bg-cream text-seat-open",
            highlight === i && "bg-gold shadow-glow",
          )}
        >
          <UserRound className="size-4" strokeWidth={2.5} />
        </span>
      ))}
    </div>
  );
}
