import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import {
  ChevronDown,
  ClipboardList,
  House,
  LogOut,
  MapPin,
  Package,
  UserRound,
  X,
} from "lucide-react";
import { CATEGORIES, categoryHref } from "@/data/categories";
import { ACCOUNT_LINKS, COMPANY_LINKS } from "@/data/site";
import { useStore } from "@/store/StoreProvider";
import { useModal } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";
import { cn, initials } from "@/lib/utils";
import { EmblemBadge } from "./Logo";

const ACCOUNT_ICONS = {
  orders: Package,
  addresses: MapPin,
  "custom-requests": ClipboardList,
} as const;

const rowClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-12 items-center gap-2 rounded-full px-4 text-[17px] font-medium",
    isActive ? "bg-leaf text-deep" : "text-deep hover:bg-sand/70",
  );

export function MobileDrawer({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, openSignIn, signOut } = useStore();
  const [productsOpen, setProductsOpen] = useState(false);
  const accordionId = useId();
  const location = useLocation();

  useModal(open, onClose, panelRef);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => onCloseRef.current(), [location.pathname, location.search]);

  if (!open) return null;

  return (
    <div className="on-light fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-deep/55" onClick={onClose} />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[min(380px,90vw)] animate-drawer-in flex-col bg-cream text-deep"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-sand px-4">
          <span className="grid size-11 place-items-center rounded-full bg-forest">
            <EmblemBadge className="size-10" />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-11 place-items-center rounded-full hover:bg-sand/70"
          >
            <X aria-hidden size={24} />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <NavLink to="/" end className={rowClass}>
                <House aria-hidden size={20} /> Home
              </NavLink>
            </li>
            <li>
              <button
                type="button"
                aria-expanded={productsOpen}
                aria-controls={accordionId}
                onClick={() => setProductsOpen((v) => !v)}
                className="flex min-h-12 w-full items-center justify-between rounded-full px-4 text-left text-[17px] font-medium hover:bg-sand/70"
              >
                Our Products
                <ChevronDown
                  aria-hidden
                  size={20}
                  className={cn("transition-transform duration-200", productsOpen && "rotate-180")}
                />
              </button>
              <div
                id={accordionId}
                hidden={!productsOpen}
                className="mx-4 mt-1 mb-3 border-l border-sand pl-4"
              >
                <Link to="/products" className="block py-2 text-[15px] font-semibold text-forest">
                  All products
                </Link>
                <ul className="space-y-3 pt-1">
                  {CATEGORIES.map((category) => (
                    <li key={category.id}>
                      <Link
                        to={categoryHref(category.slug)}
                        className="block py-1 font-display text-[17px] font-semibold"
                      >
                        {category.name}
                      </Link>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {category.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={categoryHref(category.slug, sub.slug)}
                              className="inline-block py-1 text-[15px] text-deep/75 hover:text-forest"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {COMPANY_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={rowClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-sand pt-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4">
                  <span className="grid size-10 place-items-center rounded-full bg-marigold text-[14px] font-bold">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-[14px] text-deep/70">{user.email}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {ACCOUNT_LINKS.map((link) => {
                    const Icon = ACCOUNT_ICONS[link.section];
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className="flex min-h-11 items-center gap-3 rounded-full px-4 hover:bg-sand/70"
                        >
                          <Icon aria-hidden size={18} className="text-forest" /> {link.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        onClose();
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-left hover:bg-sand/70"
                    >
                      <LogOut aria-hidden size={18} className="text-forest" /> Sign out
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openSignIn();
                }}
                className={buttonStyles.forest("w-full")}
              >
                <UserRound aria-hidden size={18} /> Sign in
              </button>
            )}
          </div>
        </nav>

        <div className="border-t border-sand bg-sand/50 px-4 py-4">
          <p className="text-[15px] text-deep/80">Can’t find what you need?</p>
          <Link
            to="/custom-order"
            className="mt-1 inline-block font-semibold text-forest underline underline-offset-4"
          >
            Request a custom order
          </Link>
        </div>
      </div>
    </div>
  );
}
