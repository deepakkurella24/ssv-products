"use client";
import { CouponsSection } from "@/components/admin/screens/coupons";
import { OutletProvider } from "@/components/admin/router-compat";

export default function CouponsLayout({ children }) {
  return (
    <OutletProvider value={children}>
      <CouponsSection />
    </OutletProvider>
  );
}
