"use client";
import { OrdersSection } from "@/components/admin/screens/orders";
import { OutletProvider } from "@/components/admin/router-compat";

export default function OrdersLayout({ children }) {
  return (
    <OutletProvider value={children}>
      <OrdersSection />
    </OutletProvider>
  );
}
