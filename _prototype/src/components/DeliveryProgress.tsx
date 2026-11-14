import { Truck } from "lucide-react";
import { FREE_DELIVERY_ABOVE } from "@/data/site";
import { formatPrice } from "@/lib/utils";

export function DeliveryProgress({ subtotal }: { subtotal: number }) {
  const left = Math.max(0, FREE_DELIVERY_ABOVE - subtotal);
  const percent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_ABOVE) * 100));
  return (
    <div className="rounded-card border border-sand bg-sand/40 p-4 sm:p-5">
      <p className="flex items-center gap-2.5 text-[15px] font-medium">
        <Truck aria-hidden size={20} className="shrink-0 text-forest" />
        {left > 0 ? (
          <span>
            Add <strong className="font-bold tabular-nums">{formatPrice(left)}</strong> more for
            free delivery
          </span>
        ) : (
          <span>Your order qualifies for free delivery</span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progress towards free delivery"
        aria-valuemin={0}
        aria-valuemax={FREE_DELIVERY_ABOVE}
        aria-valuenow={Math.min(subtotal, FREE_DELIVERY_ABOVE)}
        aria-valuetext={`${formatPrice(Math.min(subtotal, FREE_DELIVERY_ABOVE))} of ${formatPrice(FREE_DELIVERY_ABOVE)}`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-sand"
      >
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 flex justify-between text-[13px] text-deep/70 tabular-nums">
        <span>{formatPrice(0)}</span>
        <span>{formatPrice(FREE_DELIVERY_ABOVE)}</span>
      </p>
    </div>
  );
}
