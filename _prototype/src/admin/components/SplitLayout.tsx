import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile: one full-screen page (list or detail).
 * 768px+: list on the left, selected detail on the right.
 * 1024px+: with nothing selected, the list takes the full width (table view).
 */
export function SplitLayout({
  hasDetail,
  list,
  detail,
  placeholder,
}: {
  hasDetail: boolean;
  list: ReactNode;
  detail: ReactNode;
  placeholder: ReactNode;
}) {
  return (
    <div className="md:flex">
      <section
        className={cn(
          "admin-pane relative md:w-[360px] md:shrink-0 md:border-r md:border-sand lg:w-[400px]",
          hasDetail ? "max-md:hidden" : "lg:w-auto lg:flex-1 lg:border-r-0",
        )}
      >
        {list}
      </section>
      <section className={cn("admin-pane min-w-0 flex-1", !hasDetail && "max-md:hidden lg:hidden")}>
        {hasDetail ? detail : placeholder}
      </section>
    </div>
  );
}
