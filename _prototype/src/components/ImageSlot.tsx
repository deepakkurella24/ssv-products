import { Image as ImageIcon } from "lucide-react";
import { resolveImage } from "@/data/images";
import { cn } from "@/lib/utils";

interface ImageSlotProps {
  src: string;
  alt: string;
  className?: string;
  /** Dark fill for slots that sit under text (hero). */
  tone?: "light" | "dark";
  /** `compact` hides the caption for small thumbnails. */
  size?: "regular" | "compact";
  captionClassName?: string;
  loading?: "lazy" | "eager";
  /** `plain`: solid fill with a small caption only (hero arch). The fill comes from className. */
  variant?: "default" | "plain";
}

/**
 * Renders the real photo once a URL is set in data/images.ts; until then shows
 * a clearly labelled placeholder with the intended shot and ratio.
 */
export function ImageSlot({
  src,
  alt,
  className,
  tone = "light",
  size = "regular",
  captionClassName,
  loading = "lazy",
  variant = "default",
}: ImageSlotProps) {
  const image = resolveImage(src);

  if (image.kind === "photo") {
    return (
      <img
        src={image.url}
        alt={alt}
        loading={loading}
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
      />
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
        <ImageIcon aria-hidden size={18} className="absolute inset-0 m-auto opacity-40" />
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
            <ImageIcon size={14} className="mt-0.5 shrink-0" />
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
