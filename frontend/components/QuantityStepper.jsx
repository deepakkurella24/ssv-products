"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_QTY = 10;

export function QuantityStepper({
  value = 1,
  onChange,
  label,
  min = 1,
  max = MAX_QTY,
  className,
}) {
  const button =
    "grid size-11 place-items-center rounded-full transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:text-deep/35 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex h-11 items-center rounded-full border border-deep/40", className)}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={button}
      >
        <Minus aria-hidden size={16} strokeWidth={1.75} />
      </button>
      <span aria-live="polite" className="w-9 text-center font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={value >= max ? `Increase quantity (maximum ${max})` : "Increase quantity"}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        <Plus aria-hidden size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
