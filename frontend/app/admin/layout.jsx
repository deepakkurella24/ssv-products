"use client";
import { AdminShell } from "@/components/admin/shell/AdminShell";
import { OutletProvider } from "@/components/admin/router-compat";
import AuthGuard from "@/components/providers/AuthGuard";

export default function AdminLayout({ children }) {
  return (
    <AuthGuard admin>
      <OutletProvider value={children}>
        <AdminShell />
      </OutletProvider>
    </AuthGuard>
  );
}
