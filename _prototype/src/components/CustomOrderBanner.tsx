import { Link } from "react-router";
import { ArrowRight, Truck } from "lucide-react";
import { FREE_DELIVERY_ABOVE } from "@/data/site";
import { buttonStyles } from "@/lib/ui";
import { formatPrice } from "@/lib/utils";
import { LeafBranch } from "./Decor";

export function CustomOrderBanner() {
  return (
    <section aria-labelledby="custom-order-heading">
      <div className="on-dark relative overflow-hidden bg-forest text-cream">
        <LeafBranch className="pointer-events-none absolute -right-10 -bottom-24 h-[150%] text-cream/20 max-sm:opacity-60 sm:right-[4%] lg:right-[8%]" />
        <div className="shell relative py-14 lg:py-20">
          <div className="max-w-[600px]">
            <h2
              id="custom-order-heading"
              className="text-[30px] text-cream sm:text-[36px] lg:text-[44px]"
            >
              Can’t find what you’re looking for?
            </h2>
            <p className="mt-4 max-w-[480px] text-[17px] text-cream/85 lg:text-[18px]">
              Tell us what you need and how much. Our team will call you to confirm.
            </p>
            <Link to="/custom-order" className={buttonStyles.marigold("mt-8")}>
              Request a custom order
              <ArrowRight aria-hidden size={20} />
            </Link>
          </div>
        </div>
      </div>
      {/* <div className="border-b border-sand bg-sand text-deep">
        <p className="shell flex items-center justify-center gap-2.5 py-3 text-[15px]">
          <Truck aria-hidden size={20} className="text-forest" />
          <span>
            Free delivery on orders above{" "}
            <strong className="font-semibold tabular-nums">
              {formatPrice(FREE_DELIVERY_ABOVE)}
            </strong>
          </span>
        </p>
      </div> */}
    </section>
  );
}
