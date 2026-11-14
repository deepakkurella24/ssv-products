import Image from "next/image";
import { LOGOS, LOGO_SIZES } from "@/lib/images";
import { cn } from "@/lib/utils";

export function LockupOnDark({ className }) {
  return (
    <Image
      src={LOGOS.lockupOnDark}
      alt=""
      width={LOGO_SIZES.lockup.width}
      height={LOGO_SIZES.lockup.height}
      unoptimized
      className={cn("w-auto", className)}
    />
  );
}

export function EmblemBadge({ className }) {
  return (
    <Image
      src={LOGOS.emblemBadgeOnDark}
      alt=""
      width={LOGO_SIZES.emblemBadge.width}
      height={LOGO_SIZES.emblemBadge.height}
      unoptimized
      className={cn("aspect-square", className)}
    />
  );
}
