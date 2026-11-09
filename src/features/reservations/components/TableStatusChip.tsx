import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TableState } from "../types";

const LABELS: Record<TableState, string> = {
  open: "Disponible",
  low: "Últimos lugares",
  full: "Llena",
  closed: "Cerrada",
  locked: "Aún no abre",
};

const STYLES: Record<TableState, string> = {
  open: "bg-seat-open text-seat-open-foreground",
  low: "bg-seat-low text-seat-low-foreground",
  full: "bg-seat-full text-seat-full-foreground",
  closed: "bg-seat-closed text-seat-closed-foreground",
  locked: "bg-wood-dark text-gold",
};

export function TableStatusChip({ state, className }: { state: TableState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 font-pixel text-xs uppercase tracking-wide shadow-pixel-sm",
        STYLES[state],
        className,
      )}
    >
      {state === "locked" && <Lock className="size-3" aria-hidden />}
      {LABELS[state]}
    </span>
  );
}
