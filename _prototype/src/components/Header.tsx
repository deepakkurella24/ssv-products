import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { House, Menu, Search, ShoppingCart } from "lucide-react";
import { COMPANY_LINKS } from "@/data/site";
import { useStore } from "@/store/StoreProvider";
import { useScrolled } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { EmblemBadge, LockupOnDark } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileDrawer } from "./MobileDrawer";

const navItem =
  "inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[14px] font-medium transition-colors xl:px-3.5 xl:text-[15px]";
const navIdle = "text-cream/90 hover:bg-cream/10 hover:text-cream";
const navActive = "bg-leaf text-deep";

const iconButton =
  "relative inline-flex size-11 items-center justify-center gap-2 rounded-full text-cream transition-colors hover:bg-cream/10";

export function Header() {
  const { pathname } = useLocation();
  const scrolled = useScrolled(40);
  // The hero sits below the header, so the bar is always solid.
  const solid = true;
  const { cartCount, openSearch } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bump = useCartBump(cartCount);

  return (
    <header className="on-dark fixed inset-x-0 top-0 z-40 text-cream">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-forest transition-[opacity,box-shadow] duration-300",
          solid ? "opacity-100 shadow-header" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "header-fade absolute inset-0 transition-opacity duration-300",
          solid && "opacity-0",
        )}
      />
      <div aria-hidden className="leaf-texture absolute inset-0" />

      <div className="shell relative flex h-[72px] items-center lg:h-24">
        <Link to="/" aria-label="SSV, for a healthy life. Home" className="shrink-0 rounded-md p-1">
          <LockupOnDark className={cn("h-11 lg:h-14", scrolled && "max-lg:hidden")} />
          <EmblemBadge className={cn("size-11 lg:hidden", !scrolled && "hidden")} />
        </Link>

        <span aria-hidden className="mx-4 hidden h-10 w-px bg-cream/25 lg:block xl:mx-6" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => cn(navItem, isActive ? navActive : navIdle)}
              >
                <House aria-hidden size={18} />
                Home
              </NavLink>
            </li>
            <MegaMenu
              triggerClassName={cn(navItem, navIdle)}
              active={pathname.startsWith("/products")}
            />
            {COMPANY_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => cn(navItem, isActive ? navActive : navIdle)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search products"
            className={iconButton}
          >
            <Search aria-hidden size={22} />
          </button>
          <span aria-hidden className="mx-1 hidden h-7 w-px bg-cream/25 sm:block" />
          <AccountMenu buttonClassName={iconButton} />
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className={iconButton}
          >
            <ShoppingCart aria-hidden size={22} />
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
            <Menu aria-hidden size={24} />
          </button>
        </div>
      </div>

      <MobileDrawer id="mobile-drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}

/** Increments whenever the cart count goes up, so the badge can replay its bump animation. */
function useCartBump(count: number) {
  const previous = useRef(count);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (count > previous.current) setBump((b) => b + 1);
    previous.current = count;
  }, [count]);
  return bump;
}
