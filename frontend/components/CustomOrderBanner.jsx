import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/lib/ui";
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
            <Link href="/custom-order" className={buttonStyles.marigold("mt-8")}>
              Request a custom order
              <ArrowRight aria-hidden size={20} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
