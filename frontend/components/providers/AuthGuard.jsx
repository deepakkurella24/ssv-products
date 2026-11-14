"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import StatusPanel from "@/components/layout/StatusPanel";

/**
 * AuthGuard – protects routes by authentication state and role.
 *
 * Props:
 *   admin    – route is admin-only; non-admins see an Unauthorized screen.
 *   customer – route is customer-only; admins are redirected to /admin.
 *
 * Without either prop the guard only requires the user to be signed in.
 */
export default function AuthGuard({ admin = false, customer = false, children }) {
  const { firebaseUser, role, loading, refreshAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingClaims, setCheckingClaims] = useState(false);
  const attemptedRefreshRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      // Not signed in → send to sign-in with return URL
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Signed-in admin trying to access a customer-only route → send to admin
    if (customer && role === "admin") {
      router.replace("/admin");
      return;
    }

    // If an admin route is visited and role is not yet admin, attempt one force-refresh
    // before displaying "Not authorised" in case admin claims were recently granted.
    if (admin && role !== "admin" && !attemptedRefreshRef.current) {
      attemptedRefreshRef.current = true;
      setCheckingClaims(true);
      refreshAuth?.(true).finally(() => {
        setCheckingClaims(false);
      });
    }
  }, [loading, firebaseUser, role, router, pathname, customer, admin, refreshAuth]);

  // Show loading/redirect skeleton while auth resolves or redirect is in-flight
  if (loading || !firebaseUser || checkingClaims)
    return (
      <div className="shell py-20">
        <StatusPanel title="Checking your account" message="One moment…" />
      </div>
    );

  // Admin-only route accessed by a non-admin customer
  if (admin && role !== "admin")
    return (
      <div className="shell py-20">
        <StatusPanel
          title="Not authorised"
          message="This account does not have access to the admin area."
          kind="error"
          retry={() => {
            setCheckingClaims(true);
            refreshAuth?.(true).finally(() => setCheckingClaims(false));
          }}
        />
      </div>
    );

  // Customer-only route: admin is about to be redirected; render nothing while navigating
  if (customer && role === "admin") return null;

  return children;
}
