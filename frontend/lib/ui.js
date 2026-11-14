import { cn } from "./utils";

const pill =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed";

export const buttonStyles = {
  marigold: (extra = "") =>
    cn(pill, "h-12 bg-marigold px-6 text-[16px] text-deep hover:bg-marigold-dark", extra),
  forest: (extra = "") =>
    cn(pill, "h-11 bg-forest px-5 text-[15px] text-cream hover:bg-forest-dark", extra),
  outline: (extra = "") =>
    cn(
      pill,
      "h-12 border border-forest px-6 text-[16px] text-forest hover:bg-forest hover:text-cream",
      extra,
    ),
};

export const textLink =
  "inline-flex items-center gap-1.5 rounded-sm font-semibold text-forest underline-offset-4 decoration-1 hover:underline";
