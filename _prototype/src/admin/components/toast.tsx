import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CircleCheck } from "lucide-react";
import { useShell } from "@/admin/shell/ShellContext";

interface ToastOptions {
  message: string;
  tone?: "success" | "error";
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const { immersive } = useShell();
  const show = useCallback((options: ToastOptions) => setToast({ ...options, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.action ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          data-immersive={immersive}
          className="admin-root admin-toast pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 lg:pl-64"
        >
          {toast && (
            <div
              key={toast.id}
              className="pointer-events-auto flex min-h-12 w-full max-w-[460px] animate-drop-in items-center gap-3 rounded-[12px] bg-deep py-1 pr-1 pl-4 text-[15px] text-cream shadow-header"
            >
              {toast.tone === "error" ? (
                <AlertCircle size={18} className="shrink-0 text-marigold" />
              ) : (
                <CircleCheck size={18} className="shrink-0 text-leaf" />
              )}
              <span className="min-w-0 flex-1 py-2">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.onClick();
                    setToast(null);
                  }}
                  className="h-11 shrink-0 rounded-[10px] px-3 font-semibold text-leaf hover:bg-cream/10"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
