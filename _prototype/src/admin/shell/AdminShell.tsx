import { Suspense } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import {
  ChartColumn,
  ExternalLink,
  FolderTree,
  LayoutGrid,
  MessageSquareText,
  Package,
  ReceiptText,
  TicketPercent,
} from "lucide-react";
import { getAdminCounts } from "@/data/admin/orders";
import { LOGOS, LOGO_SIZES } from "@/data/images";
import { ListSkeleton } from "@/admin/components/ui";
import { ToastProvider } from "@/admin/components/toast";
import { useApi } from "@/admin/lib/useApi";
import { cn } from "@/lib/utils";
import { ShellProvider, useShell } from "./ShellContext";

const TABS = [
  { to: "/admin/orders", label: "Orders", Icon: ReceiptText, badge: "orders" as const },
  { to: "/admin/requests", label: "Requests", Icon: MessageSquareText, badge: "requests" as const },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/analytics", label: "Analytics", Icon: ChartColumn },
];

function useBadges() {
  const { data } = useApi(getAdminCounts, []);
  return { orders: data?.pendingOrders ?? 0, requests: data?.newRequests ?? 0 };
}

function Badge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1 text-[11px] leading-none font-bold text-deep tabular-nums",
        className,
      )}
    >
      {count}
    </span>
  );
}

function BottomNav() {
  const badges = useBadges();
  const { pathname } = useLocation();
  const moreActive = /^\/admin\/(more|categories|coupons)/.test(pathname);
  const tab =
    "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold";
  return (
    <nav
      aria-label="Admin"
      className="admin-nav fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-white lg:hidden"
    >
      <ul className="flex h-16">
        {TABS.map(({ to, label, Icon, badge }) => (
          <li key={to} className="flex flex-1">
            <NavLink
              to={to}
              className={({ isActive }) => cn(tab, isActive ? "text-forest" : "text-deep/65")}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "relative grid h-8 w-14 place-items-center rounded-full",
                      isActive && "bg-leaf/20",
                    )}
                  >
                    <Icon size={22} />
                    {badge && <Badge count={badges[badge]} className="absolute -top-1 right-1.5" />}
                  </span>
                  {label}
                  {badge && badges[badge] > 0 && (
                    <span className="sr-only">
                      , {badges[badge]} {badge === "orders" ? "pending" : "new"}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <NavLink
            to="/admin/more"
            aria-current={moreActive ? "page" : undefined}
            className={cn(tab, moreActive ? "text-forest" : "text-deep/65")}
          >
            <span
              className={cn(
                "grid h-8 w-14 place-items-center rounded-full",
                moreActive && "bg-leaf/20",
              )}
            >
              <LayoutGrid size={22} />
            </span>
            More
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

function Sidebar() {
  const badges = useBadges();
  const items = [
    ...TABS,
    { to: "/admin/categories", label: "Categories", Icon: FolderTree },
    { to: "/admin/coupons", label: "Coupons", Icon: TicketPercent },
  ];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sand bg-white lg:flex">
      <div className="flex h-16 items-center px-5">
        <img
          src={LOGOS.lockupOnLight}
          alt="SSV"
          width={LOGO_SIZES.lockup.width}
          height={LOGO_SIZES.lockup.height}
          className="h-10 w-auto"
        />
        <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[12px] font-semibold">
          Admin
        </span>
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-semibold",
                    isActive ? "bg-leaf/20 text-forest" : "text-deep/80 hover:bg-sand/60",
                  )
                }
              >
                <item.Icon size={20} />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge && <Badge count={badges[item.badge]} />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-sand p-3">
        <p className="truncate px-3 text-[14px] font-semibold">SSV Admin</p>
        <p className="truncate px-3 text-[13px] text-deep/65">Prototype preview</p>
        <Link
          to="/"
          className="mt-2 flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium hover:bg-sand/60"
        >
          <ExternalLink size={18} /> View store
        </Link>
      </div>
    </aside>
  );
}

function ShellFrame() {
  const { immersive } = useShell();
  return (
    <div className="admin-root on-light min-h-svh bg-cream text-[15px] leading-normal text-deep">
      <Sidebar />
      <main id="admin-main" data-immersive={immersive} className="admin-main lg:pl-60">
        <Suspense
          fallback={
            <div className="p-4">
              <ListSkeleton rows={4} />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <div className={cn(immersive && "max-md:hidden")}>
        <BottomNav />
      </div>
      <ScrollRestoration />
    </div>
  );
}

export function AdminShell() {
  return (
    <ShellProvider>
      <ToastProvider>
        <ShellFrame />
      </ToastProvider>
    </ShellProvider>
  );
}
