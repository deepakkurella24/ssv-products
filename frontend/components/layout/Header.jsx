"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Menu, Search, ShoppingCart } from "lucide-react";
import { COMPANY_LINKS } from "@/lib/site";
import { useStore } from "@/lib/store";
import { useScrolled } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { EmblemBadge, LockupOnDark } from "@/components/Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileDrawer } from "./MobileDrawer";

const navItem =
  "inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[14px] font-medium transition-colors xl:px-3.5 xl:text-[15px]";
const navIdle = "text-cream/90 hover:bg-cream/10 hover:text-cream";
const navActive = "bg-leaf text-deep";

const iconButton =
  "relative inline-flex size-11 items-center justify-center gap-2 rounded-full text-cream transition-colors hover:bg-cream/10";

export default function Header() {
  const pathname = usePathname() || "/";
  const scrolled = useScrolled(40);
  const { cartCount, openSearch } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bump = useCartBump(cartCount);

  return (
    <header className="on-dark fixed inset-x-0 top-0 z-40 text-cream">
      <div aria-hidden className="absolute inset-0 bg-forest shadow-header" />
      <div aria-hidden className="leaf-texture absolute inset-0" />

      <div className="shell relative flex h-[72px] items-center lg:h-24">
        <Link href="/" aria-label="SSV, for a healthy life. Home" className="shrink-0 rounded-md p-1">
          <LockupOnDark className={cn("h-11 lg:h-14", scrolled && "max-lg:hidden")} />
          <EmblemBadge className={cn("size-11 lg:hidden", !scrolled && "hidden")} />
        </Link>

        <span aria-hidden className="mx-4 hidden h-10 w-px bg-cream/25 lg:block xl:mx-6" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            <li>
              <Link
                href="/"
                className={cn(navItem, pathname === "/" ? navActive : navIdle)}
              >
                <House aria-hidden size={18} strokeWidth={1.75} />
                Home
              </Link>
            </li>
            <MegaMenu
              triggerClassName={cn(navItem, navIdle)}
              active={pathname.startsWith("/products")}
            />
            {COMPANY_LINKS.map((link) => {
              const href = link.to || link.href;
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(navItem, isActive ? navActive : navIdle)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search products"
            className={iconButton}
          >
            <Search aria-hidden size={22} strokeWidth={1.75} />
          </button>
          <span aria-hidden className="mx-1 hidden h-7 w-px bg-cream/25 sm:block" />
          <AccountMenu buttonClassName={iconButton} />
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className={iconButton}
          >
            <ShoppingCart aria-hidden size={22} strokeWidth={1.75} />
            <span
              key={bump}
              aria-hidden
              className={cn(
                "absolute top-0.5 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[11px] leading-none font-bold text-deep tabular-nums",
                bump > 0 && "animate-bump",
              )}
            >
              {cartCount}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className={cn(iconButton, "lg:hidden")}
          >
            <Menu aria-hidden size={24} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <MobileDrawer id="mobile-drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}

function useCartBump(count) {
  const previous = useRef(count);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (count > previous.current) setBump((b) => b + 1);
    previous.current = count;
  }, [count]);
  return bump;
}
