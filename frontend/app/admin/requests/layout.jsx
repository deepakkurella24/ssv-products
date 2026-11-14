"use client";
import { RequestsSection } from "@/components/admin/screens/requests";
import { OutletProvider } from "@/components/admin/router-compat";

export default function RequestsLayout({ children }) {
  return (
    <OutletProvider value={children}>
      <RequestsSection />
    </OutletProvider>
  );
}
