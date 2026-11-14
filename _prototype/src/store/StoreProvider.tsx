import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SEED_ADDRESSES, SEED_ORDERS, SEED_REQUESTS } from "@/data/account";
import { SEED_REVIEWS } from "@/data/reviews";
import type { Address, CartLine, CustomRequest, Order, Review, User } from "@/data/types";
import { MAX_QTY } from "@/lib/delivery";

export type NewOrder = Omit<Order, "id" | "placed_at" | "status">;
export type AddressInput = Omit<Address, "id" | "is_default">;

interface StoreValue {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;

  cart: CartLine[];
  cartCount: number;
  addToCart: (productId: string, variantId: string, qty?: number) => void;
  setCartQty: (productId: string, variantId: string, qty: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;

  addresses: Address[];
  saveAddress: (input: AddressInput, id?: string) => Address;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  orders: Order[];
  placeOrder: (order: NewOrder) => Order;
  cancelOrder: (id: string) => void;

  customRequests: CustomRequest[];
  addCustomRequest: (
    request: Omit<CustomRequest, "id" | "status" | "created_at"> & { id?: string },
  ) => CustomRequest;

  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "created_at">) => Review;
  updateReview: (id: string, updates: Partial<Review>) => Review;
  getReviewsForProduct: (productId: string) => Review[];
  getReviewForOrderProduct: (orderId: string, productId: string) => Review | undefined;

  /** Runs `action` now if signed in, otherwise after the user signs in. */
  requireAuth: (action: () => void) => void;
  signInOpen: boolean;
  openSignIn: (after?: () => void) => void;
  closeSignIn: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); state still works in memory.
  }
}

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));
  useEffect(() => writeStorage(key, value), [key, value]);
  return [value, setValue] as const;
}

const sameLine = (l: CartLine, productId: string, variantId: string) =>
  l.productId === productId && l.variantId === variantId;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = usePersisted<User | null>("ssv.user", null);
  const [cart, setCart] = usePersisted<CartLine[]>("ssv.cart", []);
  const [addresses, setAddresses] = usePersisted<Address[]>("ssv.addresses", SEED_ADDRESSES);
  const [orders, setOrders] = usePersisted<Order[]>("ssv.orders", SEED_ORDERS);
  const [customRequests, setCustomRequests] = usePersisted<CustomRequest[]>(
    "ssv.requests",
    SEED_REQUESTS,
  );
  const [reviews, setReviews] = usePersisted<Review[]>("ssv.reviews", SEED_REVIEWS);
  const [signInOpen, setSignInOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const addToCart = useCallback(
    (productId: string, variantId: string, qty = 1) => {
      setCart((lines) => {
        const existing = lines.find((l) => sameLine(l, productId, variantId));
        if (existing) {
          return lines.map((l) =>
            l === existing ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l,
          );
        }
        return [...lines, { productId, variantId, qty: Math.min(MAX_QTY, qty) }];
      });
    },
    [setCart],
  );

  const setCartQty = useCallback(
    (productId: string, variantId: string, qty: number) =>
      setCart((lines) =>
        lines.map((l) =>
          sameLine(l, productId, variantId)
            ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) }
            : l,
        ),
      ),
    [setCart],
  );

  const removeFromCart = useCallback(
    (productId: string, variantId: string) =>
      setCart((lines) => lines.filter((l) => !sameLine(l, productId, variantId))),
    [setCart],
  );

  const saveAddress = useCallback(
    (input: AddressInput, id?: string) => {
      const saved: Address = { ...input, id: id ?? `addr-${Date.now()}`, is_default: false };
      setAddresses((list) => {
        if (id) {
          return list.map((a) => (a.id === id ? { ...saved, is_default: a.is_default } : a));
        }
        // The first address becomes the default.
        return [...list, { ...saved, is_default: list.length === 0 }];
      });
      return saved;
    },
    [setAddresses],
  );

  const deleteAddress = useCallback(
    (id: string) =>
      setAddresses((list) => {
        const rest = list.filter((a) => a.id !== id);
        if (rest.length > 0 && !rest.some((a) => a.is_default))
          rest[0] = { ...rest[0], is_default: true };
        return rest;
      }),
    [setAddresses],
  );

  const setDefaultAddress = useCallback(
    (id: string) => setAddresses((list) => list.map((a) => ({ ...a, is_default: a.id === id }))),
    [setAddresses],
  );

  const placeOrder = useCallback(
    (input: NewOrder) => {
      const next = Math.max(10000, ...orders.map((o) => Number(o.id.replace(/\D/g, "")) || 0)) + 1;
      const order: Order = {
        ...input,
        id: `SSV-${next}`,
        placed_at: new Date().toISOString(),
        status: "pending",
      };
      setOrders((list) => [order, ...list]);
      setCart([]);
      return order;
    },
    [orders, setOrders, setCart],
  );

  const cancelOrder = useCallback(
    (id: string) =>
      // Only pending orders can be cancelled.
      setOrders((list) =>
        list.map((o) =>
          o.id === id && o.status === "pending" ? { ...o, status: "cancelled" } : o,
        ),
      ),
    [setOrders],
  );

  const addCustomRequest = useCallback(
    (input: Omit<CustomRequest, "id" | "status" | "created_at"> & { id?: string }) => {
      const request: CustomRequest = {
        ...input,
        id: input.id ?? `REQ-${Date.now() % 100000}`,
        status: "received",
        created_at: new Date().toISOString(),
      };
      setCustomRequests((list) => [request, ...list]);
      return request;
    },
    [setCustomRequests],
  );

  const addReview = useCallback(
    (input: Omit<Review, "id" | "created_at">) => {
      const review: Review = {
        ...input,
        id: `rev-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setReviews((list) => [review, ...list]);
      return review;
    },
    [setReviews],
  );

  const updateReview = useCallback(
    (id: string, updates: Partial<Review>) => {
      let updated: Review | undefined;
      setReviews((list) =>
        list.map((r) => {
          if (r.id === id) {
            updated = { ...r, ...updates };
            return updated;
          }
          return r;
        }),
      );
      return updated ?? (updates as Review);
    },
    [setReviews],
  );

  const getReviewsForProduct = useCallback(
    (productId: string) => reviews.filter((r) => r.product_id === productId),
    [reviews],
  );

  const getReviewForOrderProduct = useCallback(
    (orderId: string, productId: string) =>
      reviews.find((r) => r.order_id === orderId && r.product_id === productId),
    [reviews],
  );

  const openSignIn = useCallback((after?: () => void) => {
    pendingAction.current = after ?? null;
    setSignInOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    pendingAction.current = null;
    setSignInOpen(false);
  }, []);

  const signIn = useCallback(
    (next: User) => {
      setUser(next);
      setSignInOpen(false);
      const action = pendingAction.current;
      pendingAction.current = null;
      // Let the dialog close and focus return before running the pending action.
      if (action) setTimeout(action, 0);
    },
    [setUser],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setCart([]);
  }, [setUser, setCart]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) action();
      else openSignIn(action);
    },
    [user, openSignIn],
  );

  const value = useMemo<StoreValue>(
    () => ({
      user,
      signIn,
      signOut,
      cart,
      cartCount: cart.reduce((sum, l) => sum + l.qty, 0),
      addToCart,
      setCartQty,
      removeFromCart,
      addresses,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      orders,
      placeOrder,
      cancelOrder,
      customRequests,
      addCustomRequest,
      reviews,
      addReview,
      updateReview,
      getReviewsForProduct,
      getReviewForOrderProduct,
      requireAuth,
      signInOpen,
      openSignIn,
      closeSignIn,
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
    }),
    [
      user,
      signIn,
      signOut,
      cart,
      addToCart,
      setCartQty,
      removeFromCart,
      addresses,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      orders,
      placeOrder,
      cancelOrder,
      customRequests,
      addCustomRequest,
      reviews,
      addReview,
      updateReview,
      getReviewsForProduct,
      getReviewForOrderProduct,
      requireAuth,
      signInOpen,
      openSignIn,
      closeSignIn,
      searchOpen,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
