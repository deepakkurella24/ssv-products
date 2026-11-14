import { LOGOS, LOGO_SIZES } from "@/data/images";
import { cn } from "@/lib/utils";

// Supplied logo artwork, used as-is. Width is derived from height so it never stretches.

export function LockupOnDark({ className }: { className?: string }) {
  return (
    <img
      src={LOGOS.lockupOnDark}
      alt=""
      width={LOGO_SIZES.lockup.width}
      height={LOGO_SIZES.lockup.height}
      className={cn("w-auto", className)}
    />
  );
}

export function EmblemBadge({ className }: { className?: string }) {
  return (
    <img
      src={LOGOS.emblemBadgeOnDark}
      alt=""
      width={LOGO_SIZES.emblemBadge.width}
      height={LOGO_SIZES.emblemBadge.height}
      className={cn("aspect-square", className)}
    />
  );
}
