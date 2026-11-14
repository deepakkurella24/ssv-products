"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RoleRedirect({ children }) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    // Wait until Firebase has resolved the session
    if (loading) return;
    // Only redirect admins
    if (role !== "admin") return;

    // Already on an admin page — reset flag and do not redirect
    if (pathname && pathname.startsWith("/admin")) {
      redirected.current = false;
      return;
    }

    // Prevent duplicate triggers while redirect is in flight
    if (redirected.current) return;

    redirected.current = true;
    router.replace("/admin");
  }, [loading, role, pathname, router]);

  // Prevent flash of non-admin content for admin users while redirect is in-flight
  if (!loading && role === "admin" && pathname && !pathname.startsWith("/admin")) {
    return null;
  }

  return children;
}
