"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass, IconButton } from "./ui";
const stack = [];
let originalOverflow = "";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function Sheet(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!props.open || !mounted) return null;
  return createPortal(<SheetPanel {...props} />, document.body);
}
function SheetPanel({ onClose, title, description, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();
  const id = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    stack.push(id);
    const root = document.documentElement;
    if (stack.length === 1) originalOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const previous = document.activeElement;
    const frame = requestAnimationFrame(() => {
      const target = ref.current?.querySelector("[data-autofocus]") ?? ref.current;
      target?.focus();
    });
    const onKey = (e) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === "Tab" && ref.current) {
        const items = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter(
          (el) => el.getClientRects().length > 0
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) root.style.overflow = originalOverflow;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [id]);
  return <div className="admin-root on-light fixed inset-0 z-50 flex items-end justify-center text-deep md:items-center md:p-6">
      <div
    aria-hidden
    className="absolute inset-0 animate-fade-in bg-deep/50"
    onClick={() => onCloseRef.current()}
  />
      <div
    ref={ref}
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    tabIndex={-1}
    className="relative flex max-h-[90svh] w-full animate-sheet-in flex-col rounded-t-[16px] bg-cream shadow-header outline-none md:max-w-[460px] md:animate-drop-in md:rounded-card"
  >
        <span
    aria-hidden
    className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-deep/20 md:hidden"
  />
        <div className="flex shrink-0 items-start gap-2 pt-2 pr-2 pb-1 pl-5">
          <div className="min-w-0 flex-1 pt-2.5">
            <h2 id={titleId} className="text-[18px] leading-tight font-semibold">
              {title}
            </h2>
            {description && <div className="mt-1 text-[14px] text-deep/70">{description}</div>}
          </div>
          <IconButton label="Close" onClick={() => onCloseRef.current()}>
            <X size={22} />
          </IconButton>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 pt-2 pb-5">{children}</div>
        {footer && <div className="admin-safe-bottom shrink-0 border-t border-sand px-5 pt-3">{footer}</div>}
      </div>
    </div>;
}
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onClose
}) {
  const [busy, setBusy] = useState(false);
  return <Sheet open={open} onClose={() => !busy && onClose()} title={title}>
      {message && <div className="text-[15px] text-deep/85">{message}</div>}
      <div className="mt-5 grid gap-2">
        <button
    type="button"
    disabled={busy}
    onClick={async () => {
      setBusy(true);
      try {
        await onConfirm();
      } finally {
        setBusy(false);
      }
    }}
    className={buttonClass(destructive ? "danger" : "primary", "w-full")}
  >
          {busy ? "Working\u2026" : confirmLabel}
        </button>
        <button
    type="button"
    disabled={busy}
    onClick={onClose}
    className={buttonClass("secondary", "w-full")}
  >
          {cancelLabel}
        </button>
      </div>
    </Sheet>;
}
export function OptionRow({
  selected,
  onClick,
  title,
  text,
  tone
}) {
  return <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className={cn(
      "flex min-h-14 w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors",
      selected ? tone === "danger" ? "border-brick bg-brick/5" : "border-forest bg-leaf/10" : "border-sand bg-white"
    )}
  >
      <span
    aria-hidden
    className={cn(
      "grid size-5 shrink-0 place-items-center rounded-full border-2",
      selected ? tone === "danger" ? "border-brick" : "border-forest" : "border-deep/30"
    )}
  >
        {selected && <span
    className={cn("size-2.5 rounded-full", tone === "danger" ? "bg-brick" : "bg-forest")}
  />}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-[16px] font-semibold", tone === "danger" && "text-brick")}>
          {title}
        </span>
        {text && <span className="block text-[14px] text-deep/70">{text}</span>}
      </span>
    </button>;
}

export function FormModal(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!props.open || !mounted) return null;
  return createPortal(<FormModalPanel {...props} />, document.body);
}

function FormModalPanel({ onClose, children }) {
  const ref = useRef(null);
  const id = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    stack.push(id);
    const root = document.documentElement;
    if (stack.length === 1) originalOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const previous = document.activeElement;
    const frame = requestAnimationFrame(() => {
      const target = ref.current?.querySelector("[data-autofocus]") ?? ref.current;
      target?.focus();
    });
    const onKey = (e) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current?.();
      } else if (e.key === "Tab" && ref.current) {
        const items = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter(
          (el) => el.getClientRects().length > 0
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) root.style.overflow = originalOverflow;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [id]);

  return (
    <div className="admin-root on-light fixed inset-0 z-50 flex items-end justify-center text-deep md:items-center md:p-6">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-deep/50"
        onClick={() => onCloseRef.current?.()}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative flex max-h-[92svh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-[20px] bg-cream shadow-header outline-none md:max-h-[88svh] md:max-w-2xl md:animate-drop-in md:rounded-[20px]"
      >
        <span
          aria-hidden
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-deep/20 md:hidden"
        />
        {children}
      </div>
    </div>
  );
}
