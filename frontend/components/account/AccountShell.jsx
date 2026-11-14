"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, MapPin, Package } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { buttonStyles } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const TABS = [
  { to: "/account/orders", label: "My orders", Icon: Package },
  { to: "/account/addresses", label: "Addresses", Icon: MapPin },
  { to: "/account/custom-requests", label: "Custom requests", Icon: ClipboardList },
];

export function AccountShell({ children }) {
  const { user, openSignIn } = useStore();
  const pathname = usePathname() || "";

  if (!user) {
    return (
      <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My account" }]} />
        <h1 className="mt-8 text-[34px] lg:text-[42px]">Sign in to see your account</h1>
        <p className="mt-3 max-w-[480px] text-[17px] text-deep/80">
          Your orders, saved addresses and custom requests are kept here.
        </p>
        <button
          type="button"
          onClick={() => openSignIn()}
          className={buttonStyles.forest("mt-6 h-12 px-6 text-[16px]")}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My account" }]} />
      <div className="mt-6 lg:mt-8">
        <h1 className="text-[34px] lg:text-[44px]">My account</h1>
        <p className="mt-1 text-deep/75">Signed in as {user.name}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr] lg:gap-12">
        <nav
          aria-label="Account"
          className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        >
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {TABS.map(({ to, label, Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <li key={to} className="shrink-0">
                  <Link
                    href={to}
                    className={cn(
                      "flex h-11 items-center gap-2.5 rounded-full px-4 text-[15px] font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-forest text-cream"
                        : "border border-sand hover:bg-sand/60 lg:border-transparent",
                    )}
                  >
                    <Icon aria-hidden size={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default AccountShell;
