"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ rating = 0, size = 16, className, showText = false }) {
  const clamped = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <div
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((pos) => {
          const fillAmount = Math.max(0, Math.min(1, clamped - (pos - 1)));
          return (
            <span key={pos} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="text-sand-dark" fill="none" strokeWidth={1.75} />
              {fillAmount > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fillAmount * 100}%` }}
                >
                  <Star size={size} className="text-marigold fill-marigold" strokeWidth={1.75} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showText && (
        <span className="font-bold tabular-nums text-deep text-[15px] ml-1">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
}

const RATING_DESCRIPTIONS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export function StarPicker({
  value = 0,
  onChange,
  size = 32,
  label = "Your rating",
  error,
}) {
  const [hovered, setHovered] = useState(null);
  const activeRating = hovered ?? value;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[15px] font-semibold text-deep">
          {label}
          <span aria-hidden className="text-clay">
            {" "}
            *
          </span>
        </label>
        {activeRating > 0 && (
          <span className="text-[14px] font-semibold text-clay">
            {RATING_DESCRIPTIONS[activeRating]}
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Star rating out of 5"
        className="mt-2 flex items-center gap-1.5"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}: ${RATING_DESCRIPTIONS[star]}`}
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange && onChange(star)}
              className="p-1 rounded-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  filled
                    ? "fill-marigold text-marigold"
                    : "fill-transparent text-deep/30 hover:text-deep/50",
                )}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-[14px] font-medium text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
