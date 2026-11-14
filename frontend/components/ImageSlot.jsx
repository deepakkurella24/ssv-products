import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { cn } from "@/lib/utils";

export function ImageSlot({
  src,
  alt = "",
  className,
  tone = "light",
  size = "regular",
  captionClassName,
  loading = "lazy",
  variant = "default",
}) {
  const image = resolveImage(src);

  if (image.kind === "photo") {
    return (
      <span className={cn("relative block h-full w-full", className)}>
        <Image
          src={image.url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
          loading={loading}
          decoding="async"
          className="object-cover object-center"
        />
      </span>
    );
  }

  if (variant === "plain") {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("relative h-full w-full overflow-hidden text-deep", className)}
      >
        <span
          aria-hidden
          className="absolute inset-x-6 bottom-4 line-clamp-2 text-center text-[11px] leading-[1.35] text-deep/70"
        >
          {image.caption}
        </span>
      </div>
    );
  }

  const dark = tone === "dark";
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative h-full w-full overflow-hidden",
        dark ? "bg-slot-dark text-cream" : "bg-slot text-deep",
        className,
      )}
    >
      {size === "compact" ? (
        <ImageIcon aria-hidden size={18} strokeWidth={1.75} className="absolute inset-0 m-auto opacity-40" />
      ) : (
        <>
          <div
            aria-hidden
            className={cn(
              "absolute inset-2 rounded-[8px] border border-dashed",
              dark ? "border-cream/20" : "border-clay/30",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute flex items-start gap-2 text-[12px] leading-[1.4]",
              dark ? "text-cream/75" : "text-deep/70",
              captionClassName ?? "inset-x-4 bottom-4",
            )}
          >
            <ImageIcon size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                Image slot{image.ratio ? ` · ${image.ratio}` : ""}
              </span>
              <span className="line-clamp-3">{image.caption}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
