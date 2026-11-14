import { TONE_CLASS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ label, tone = "sand" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap",
        TONE_CLASS[tone] || TONE_CLASS.sand,
      )}
    >
      {label}
    </span>
  );
}
