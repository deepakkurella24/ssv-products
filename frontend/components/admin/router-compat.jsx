"use client";
import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from "next/navigation";

const OutletContext = createContext(null);

export function OutletProvider({ value, children }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

export function Outlet() {
  return useContext(OutletContext);
}

export function ScrollRestoration() {
  return null;
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function useLocation() {
  const pathname = usePathname() || "";
  const nextParams = useNextSearchParams();
  const search = nextParams?.toString() ? `?${nextParams.toString()}` : "";
  return useMemo(() => ({
    pathname,
    search,
    hash: "",
    state: typeof window !== "undefined" ? window.history?.state?.usr || null : null,
  }), [pathname, search]);
}

export function useNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback((to, options = {}) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      return;
    }
    let dest = "";
    if (typeof to === "string") {
      dest = to;
    } else if (to && typeof to === "object") {
      dest = to.pathname || "";
      if (to.search) {
        dest += to.search.startsWith("?") ? to.search : `?${to.search}`;
      }
    }
    if (options.replace) {
      router.replace(dest);
    } else {
      router.push(dest);
    }
  }, [router]);
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const nextSearchParams = useNextSearchParams();

  const searchParams = useMemo(() => {
    return new URLSearchParams(nextSearchParams?.toString() || "");
  }, [nextSearchParams]);

  const setSearchParams = useCallback((newParams, options = {}) => {
    let resolved = newParams;
    if (typeof newParams === "function") {
      resolved = newParams(new URLSearchParams(nextSearchParams?.toString() || ""));
    }
    const target = new URLSearchParams();
    if (resolved instanceof URLSearchParams) {
      for (const [k, v] of resolved.entries()) {
        target.set(k, v);
      }
    } else if (resolved && typeof resolved === "object") {
      for (const [k, v] of Object.entries(resolved)) {
        if (v !== undefined && v !== null && v !== "") {
          target.set(k, String(v));
        }
      }
    }
    const qs = target.toString();
    const dest = qs ? `${pathname}?${qs}` : pathname;
    if (options.replace) {
      router.replace(dest, { scroll: false });
    } else {
      router.push(dest, { scroll: false });
    }
  }, [router, pathname, nextSearchParams]);

  return [searchParams, setSearchParams];
}

export function Link({ to, href, children, ...props }) {
  const dest = to || href || "#";
  return (
    <NextLink href={dest} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, children, ...props }) {
  const pathname = usePathname();
  const target = to || href || "#";
  const isActive = pathname === target || (target !== "/admin" && pathname?.startsWith(target));
  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;
  const resolvedChildren = typeof children === "function" ? children({ isActive }) : children;
  return (
    <NextLink href={target} className={resolvedClass} {...props}>
      {resolvedChildren}
    </NextLink>
  );
}

export function useBeforeUnload(fn) {
  useEffect(() => {
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [fn]);
}

export function useBlocker() {
  return { state: "unblocked", proceed: () => {}, reset: () => {} };
}
