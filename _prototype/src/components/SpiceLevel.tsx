import type { SpiceLevel as Level } from "@/data/types";
import { cn } from "@/lib/utils";

// Lucide has no chilli, so this follows its outline style (24 grid, 1.75 stroke).
function Chilli({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 7.2C13.5 5.4 17.6 6.4 18.4 10.4 19.4 15.6 14.2 20.2 4 20.8 8.6 18 9.6 15.4 9.4 12.2 9.3 10 9.4 8.3 10.5 7.2Z" />
      <path d="M12.4 6.3C12.2 4.6 13.4 3.2 15.4 3" />
    </svg>
  );
}

const LEVELS: Record<Exclude<Level, null>, { count: number; label: string }> = {
  mild: { count: 1, label: "Mild" },
  medium: { count: 2, label: "Medium" },
  hot: { count: 3, label: "Hot" },
};

export function SpiceLevel({ level }: { level: Exclude<Level, null> }) {
  const { count, label } = LEVELS[level];
  return (
    <span className="inline-flex items-center gap-2">
      <span role="img" aria-label={`${count} of 3 chillies`} className="inline-flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn(n <= count ? "text-clay" : "text-deep/25")}>
            <Chilli filled={n <= count} />
          </span>
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
