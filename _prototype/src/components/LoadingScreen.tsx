import { EmblemBadge } from "./Logo";

export function LoadingScreen() {
  return (
    <div role="status" className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-20 place-items-center rounded-full bg-forest motion-safe:animate-pulse">
          <EmblemBadge className="size-16" />
        </span>
        <span className="text-[15px] text-deep/70">Loading…</span>
      </div>
    </div>
  );
}
