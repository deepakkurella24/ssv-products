"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useCategories } from "@/lib/hooks";
import { categoryHref } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** "Our Products" nav item: opens on hover or click, lists categories with subcategories. */
export function MegaMenu({ triggerClassName, active }) {
  const { categories = [] } = useCategories();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(undefined);
  const triggerRef = useRef(null);
  const wrapperRef = useRef(null);
  const panelId = useId();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => setOpen(false), [pathname, searchParams]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <li
      ref={wrapperRef}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(triggerClassName, active && "bg-leaf text-deep")}
      >
        Our Products
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={1.75}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="on-light absolute inset-x-8 top-full z-10 animate-drop-in"
      >
        <div className="overflow-hidden rounded-card border border-sand bg-cream text-deep shadow-warm">
          <ul className="grid grid-cols-5 gap-x-6 px-8 pt-7 pb-6">
            {categories.map((category) => (
              <li key={category.id} className="min-w-0">
                <Link
                  href={categoryHref(category.slug)}
                  className="group block rounded-sm font-display text-[18px] leading-tight font-semibold text-deep"
                >
                  <span className="decoration-1 underline-offset-4 group-hover:underline">
                    {category.name}
                  </span>
                </Link>
                <p className="mt-1 text-[13px] text-clay tabular-nums">
                  {category.product_count ?? 0} products
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-sand pt-3">
                  {(category.subcategories || []).map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={categoryHref(category.slug, sub.slug)}
                        className="rounded-sm text-[15px] text-deep/80 decoration-1 underline-offset-4 hover:text-forest hover:underline"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-sand bg-sand/40 px-8 py-4 text-[15px]">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-sm font-semibold text-forest underline-offset-4 hover:underline"
            >
              All products <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
            </Link>
            <p className="text-deep/75">
              Need something else?{" "}
              <Link
                href="/custom-order"
                className="rounded-sm font-semibold text-forest underline underline-offset-4"
              >
                Request a custom order
              </Link>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
