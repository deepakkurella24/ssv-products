import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, ClipboardList, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useStore } from "@/store/StoreProvider";
import { ACCOUNT_LINKS } from "@/data/site";
import { useClickOutside } from "@/lib/hooks";
import { cn, initials } from "@/lib/utils";

const ICONS = { orders: Package, addresses: MapPin, "custom-requests": ClipboardList } as const;

export function AccountMenu({ buttonClassName }: { buttonClassName: string }) {
  const { user, openSignIn, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const location = useLocation();

  useClickOutside(ref, open, () => setOpen(false));
  useEffect(() => setOpen(false), [location.pathname, location.search]);

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className={cn(buttonClassName, "xl:w-auto xl:px-3")}
      >
        <UserRound aria-hidden size={22} />
        <span className="sr-only xl:not-sr-only xl:text-[15px] xl:font-medium">Sign in</span>
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(buttonClassName, "w-auto gap-1 px-1")}
      >
        <span className="grid size-8 place-items-center rounded-full bg-marigold text-[13px] font-bold text-deep">
          {initials(user.name)}
        </span>
        <ChevronDown
          aria-hidden
          size={16}
          className={cn("hidden transition-transform sm:block", open && "rotate-180")}
        />
      </button>

      <div
        id={menuId}
        hidden={!open}
        className="on-light absolute top-full right-0 z-10 mt-3 w-64 animate-drop-in overflow-hidden rounded-card border border-sand bg-cream text-deep shadow-warm"
      >
        <div className="border-b border-sand px-4 py-3">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-[14px] text-deep/70">{user.email}</p>
        </div>
        <ul className="py-2">
          {ACCOUNT_LINKS.map((link) => {
            const Icon = ICONS[link.section];
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="flex items-center gap-3 px-4 py-2 text-[15px] hover:bg-sand/60 focus-visible:-outline-offset-2"
                >
                  <Icon aria-hidden size={18} className="text-forest" />
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-1 border-t border-sand pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-[15px] hover:bg-sand/60 focus-visible:-outline-offset-2"
            >
              <LogOut aria-hidden size={18} className="text-forest" />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
