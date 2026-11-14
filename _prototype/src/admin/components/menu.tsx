import { useEffect, useId, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./ui";

export function OverflowMenu({
  items,
  label = "More actions",
}: {
  items: { label: string; onClick: () => void; danger?: boolean }[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <EllipsisVertical size={22} />
      </IconButton>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 min-w-52 overflow-hidden rounded-[12px] border border-sand bg-white py-1 shadow-header"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex min-h-12 w-full items-center px-4 text-left text-[15px] font-medium hover:bg-sand/50",
                item.danger && "text-brick",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
