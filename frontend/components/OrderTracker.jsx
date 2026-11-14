import { Check } from "lucide-react";
import { ORDER_STEPS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function OrderTracker({ status }) {
  const current = ORDER_STEPS.findIndex((s) => s.key === status);
  return (
    <ol aria-label="Order progress" className="grid md:grid-cols-5">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current || status === "delivered";
        const isCurrent = i === current && status !== "delivered";
        const last = i === ORDER_STEPS.length - 1;
        return (
          <li
            key={step.key}
            aria-current={i === current ? "step" : undefined}
            className="relative flex items-start gap-4 pb-7 last:pb-0 md:flex-col md:gap-3 md:pb-0"
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 bg-sand md:top-4 md:right-0 md:bottom-auto md:left-8 md:h-0.5 md:w-auto md:translate-x-0",
                  done && "bg-forest",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-semibold",
                done && "bg-forest text-cream",
                isCurrent && "bg-marigold text-deep ring-4 ring-marigold/30",
                !done && !isCurrent && "border border-deep/30 bg-cream text-deep/55",
              )}
            >
              {done ? <Check size={16} /> : i + 1}
            </span>
            <span className="pt-1 md:pt-0">
              <span
                className={cn(
                  "block text-[15px]",
                  i === current ? "font-bold" : "font-medium text-deep/80",
                )}
              >
                {step.label}
              </span>
              <span className="sr-only">
                {done ? "Completed" : isCurrent ? "Current step" : "Not reached yet"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTracker;
