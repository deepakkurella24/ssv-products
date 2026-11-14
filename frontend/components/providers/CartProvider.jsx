"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/user";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");

    if (!firebaseUser) {
      setItems([]);
      return;
    }

    firebaseUser
      .getIdToken()
      .then(getCart)
      .then((data) => {
        if (active) setItems(data.cart_items || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });

    return () => {
      active = false;
    };
  }, [firebaseUser, refresh]);

  const value = {
    items,
    error,
    reload: () => setRefresh((current) => current + 1),
    count: items.reduce((sum, item) => sum + item.quantity, 0),

    addItem: async (product, variant, quantity = 1, details = {}) => {
      const token = await firebaseUser?.getIdToken();
      const old = items;
      const found = items.find(
        (i) => i.product_id === product && i.variant_id === variant,
      );
      const temporaryId = `new-${Date.now()}`;
      setError("");

      setItems(
        found
          ? items.map((i) =>
              i === found
                ? { ...i, quantity: Math.min(10, i.quantity + quantity) }
                : i,
            )
          : [
              ...items,
              {
                id: temporaryId,
                product_id: product,
                variant_id: variant,
                quantity,
                ...details,
              },
            ],
      );

      try {
        const result = await addCartItem(
          { product_id: product, variant_id: variant, quantity },
          token,
        );
        setItems((current) =>
          found
            ? current.map((i) => (i.id === found.id ? result : i))
            : current.map((i) => (i.id === temporaryId ? result : i)),
        );
      } catch (e) {
        setItems(old);
        setError(e.message);
      }
    },

    setQuantity: async (item, quantity) => {
      const token = await firebaseUser?.getIdToken();
      const old = items;
      const nextQuantity = Math.max(1, Math.min(10, quantity));
      setError("");

      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, quantity: nextQuantity } : i,
        ),
      );

      try {
        const result = await updateCartItem(
          item.id,
          { quantity: nextQuantity },
          token,
        );
        setItems((current) =>
          current.map((i) => (i.id === item.id ? result : i)),
        );
      } catch (e) {
        setItems(old);
        setError(e.message);
      }
    },

    removeItem: async (itemOrId) => {
      const id = typeof itemOrId === "object" ? itemOrId?.id : itemOrId;
      const token = await firebaseUser?.getIdToken();
      const old = items;
      setError("");

      setItems(items.filter((i) => i.id !== id));

      try {
        await removeCartItem(id, token);
      } catch (e) {
        setItems(old);
        setError(e.message);
      }
    },

    reset: () => setItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
