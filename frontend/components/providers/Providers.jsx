"use client";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { StoreProvider } from "@/lib/store";
import RoleRedirect from "./RoleRedirect";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <RoleRedirect>
        <CartProvider>
          <StoreProvider>{children}</StoreProvider>
        </CartProvider>
      </RoleRedirect>
    </AuthProvider>
  );
}
