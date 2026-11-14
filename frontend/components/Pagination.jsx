"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageSize, total, onPageChange, className = "" }) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

  return (
    <nav aria-label="Pagination" className={cn("mt-6 flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-[13px] text-deep/70" aria-live="polite">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="grid size-10 place-items-center rounded-full border border-sand text-deep hover:bg-sand/60 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            aria-current={page === number ? "page" : undefined}
            aria-label={`Page ${number}`}
            className={cn(
              "size-10 rounded-full text-[14px] font-semibold",
              page === number ? "bg-forest text-cream" : "text-deep hover:bg-sand/60",
            )}
          >
            {number}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className="grid size-10 place-items-center rounded-full border border-sand text-deep hover:bg-sand/60 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
