"use client";
import { useEffect, useRef, useState } from "react";
import { getCategories, getProducts } from "./api/public";
import { adaptProduct } from "./adapters";

export function useScrolled(threshold) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Products are loaded once and shared across screens
let productsCache = null;
let productsRequest = null;

export function useProducts() {
  const [products, setProducts] = useState(productsCache);
  useEffect(() => {
    if (productsCache) {
      setProducts(productsCache);
      return;
    }
    let active = true;
    productsRequest ??= getProducts()
      .then((res) => {
        const raw = res?.products || (Array.isArray(res) ? res : []);
        productsCache = raw.map(adaptProduct);
        return productsCache;
      })
      .catch(() => [])
      .finally(() => {
        productsRequest = null;
      });
    productsRequest.then((list) => {
      if (active) setProducts(list);
    });
    return () => {
      active = false;
    };
  }, []);
  return { products: products ?? [], loading: products === null };
}

// Categories are loaded once and shared across navigation and filter screens
let categoriesCache = null;
let categoriesRequest = null;

export function useCategories() {
  const [categories, setCategories] = useState(categoriesCache);
  useEffect(() => {
    if (categoriesCache) {
      setCategories(categoriesCache);
      return;
    }
    let active = true;
    categoriesRequest ??= getCategories()
      .then((res) => {
        categoriesCache = Array.isArray(res) ? res : res?.categories || [];
        return categoriesCache;
      })
      .catch(() => [])
      .finally(() => {
        categoriesRequest = null;
      });
    categoriesRequest.then((list) => {
      if (active) setCategories(list);
    });
    return () => {
      active = false;
    };
  }, []);
  return { categories: categories ?? [], loading: categories === null };
}

export function useClickOutside(ref, active, handler) {
  useEffect(() => {
    if (!active) return;
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, active, handler]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Dialog behaviour: focus trap, Escape to close, scroll lock and focus restore. */
export function useModal(open, onClose, ref) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const focusables = () =>
      Array.from(ref.current?.querySelectorAll(FOCUSABLE) ?? []).filter(
        (el) => el.getClientRects().length > 0,
      );
    const frame = requestAnimationFrame(() => {
      const target = ref.current?.querySelector("[data-autofocus]") ?? focusables()[0];
      target?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, ref]);
}
