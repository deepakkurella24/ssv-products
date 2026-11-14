"use client";
import { createContext, useContext, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { firebaseUser, role, signOut: authSignOut } = useAuth();
  const { items: cartItems = [], count: cartCount = 0, addItem, setQuantity, removeItem, reset: resetCart } = useCart() || {};

  const [signInOpen, setSignInOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pendingAction = useRef(null);

  const user = useMemo(() => {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Account",
      email: firebaseUser.email || "",
      role: role || "customer",
    };
  }, [firebaseUser, role]);

  const openSignIn = useCallback((after) => {
    pendingAction.current = after || null;
    setSignInOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    pendingAction.current = null;
    setSignInOpen(false);
  }, []);

  const requireAuth = useCallback(
    (action) => {
      if (user) {
        action();
      } else {
        openSignIn(action);
      }
    },
    [user, openSignIn]
  );

  const signOut = useCallback(async () => {
    if (authSignOut) await authSignOut();
  }, [authSignOut]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const addToCart = useCallback(
    async (productId, variantId, qty = 1) => {
      if (addItem) {
        await addItem(productId, variantId, qty);
      }
    },
    [addItem]
  );

  const setCartQty = useCallback(
    async (productId, variantId, qty) => {
      const found = cartItems.find((i) => i.product_id === productId && i.variant_id === variantId);
      if (found && setQuantity) {
        await setQuantity(found, qty);
      }
    },
    [cartItems, setQuantity]
  );

  const removeFromCart = useCallback(
    async (productId, variantId) => {
      const found = cartItems.find((i) => i.product_id === productId && i.variant_id === variantId);
      if (found && removeItem) {
        await removeItem(found.id);
      }
    },
    [cartItems, removeItem]
  );

  const value = {
    user,
    signInOpen,
    openSignIn,
    closeSignIn,
    requireAuth,
    signOut,
    searchOpen,
    openSearch,
    closeSearch,
    cartItems,
    cartCount,
    addToCart,
    setCartQty,
    removeFromCart,
    resetCart,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
