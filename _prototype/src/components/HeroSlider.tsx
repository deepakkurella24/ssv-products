import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Leaf, Pause, Play } from "lucide-react";
import { HERO_SLIDES, type HeroSlide } from "@/data/site";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { LeafBranch } from "./Decor";
import { ImageSlot } from "./ImageSlot";

const INTERVAL_MS = 3000;
const CHANGE_MS = "duration-[450ms]";

// One flat colour set per slide: no gradients, scrims or overlays.
const THEMES = {
  forest: {
    bg: "bg-forest",
    text: "text-cream",
    focus: "on-dark",
    circle: "bg-forest-light",
    cta: "bg-marigold text-deep hover:bg-marigold-dark",
    link: "decoration-cream/50 hover:decoration-cream",
    slot: "bg-slot",
  },
  honey: {
    bg: "bg-honey",
    text: "text-deep",
    focus: "on-light",
    circle: "bg-honey-light",
    cta: "bg-forest text-cream hover:bg-forest-dark",
    link: "decoration-deep/40 hover:decoration-deep",
    slot: "bg-sand",
  },
  sand: {
    bg: "bg-sand",
    text: "text-deep",
    focus: "on-light",
    circle: "bg-sand-dark",
    cta: "bg-forest text-cream hover:bg-forest-dark",
    link: "decoration-deep/40 hover:decoration-deep",
    slot: "bg-cream",
  },
} as const;

// Chips pinned to the arch edges at slightly different heights (desktop and tablet only).
const CHIP_POSITIONS = [
  "top-[28%] left-2 lg:-left-12",
  "top-[50%] -right-3 lg:-right-14",
  "top-[73%] left-2 lg:-left-6",
];

export function HeroSlider() {
  const count = HERO_SLIDES.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchStart = useRef<number | null>(null);

  const go = useCallback((step: number) => setIndex((i) => (i + step + count) % count), [count]);
  const autoplay = !reducedMotion;
  const paused = hovered || focused || tabHidden || stopped;
  const theme = THEMES[HERO_SLIDES[index].theme];

  useEffect(() => {
    const update = () => setTabHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured from SSV"
      className={cn(
        "relative h-[560px] overflow-hidden transition-colors",
        CHANGE_MS,
        theme.bg,
        theme.text,
        theme.focus,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <p className="sr-only" aria-live={paused ? "polite" : "off"}>
        Slide {index + 1} of {count}
      </p>

      {HERO_SLIDES.map((slide, i) => (
        <Slide
          key={slide.id}
          slide={slide}
          position={i}
          count={count}
          index={index}
          active={i === index}
          autoplay={autoplay}
          paused={paused}
          stopped={stopped}
          onGo={go}
          onSelect={setIndex}
          onToggle={() => setStopped((s) => !s)}
        />
      ))}
    </section>
  );
}

interface SlideProps {
  slide: HeroSlide;
  position: number;
  count: number;
  index: number;
  active: boolean;
  autoplay: boolean;
  paused: boolean;
  stopped: boolean;
  onGo: (step: number) => void;
  onSelect: (i: number) => void;
  onToggle: () => void;
}

function Slide({
  slide,
  position,
  count,
  index,
  active,
  autoplay,
  paused,
  stopped,
  onGo,
  onSelect,
  onToggle,
}: SlideProps) {
  const theme = THEMES[slide.theme];
  const Heading = position === 0 ? "h1" : "h2";

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position + 1} of ${count}`}
      aria-hidden={!active}
      inert={!active}
      className={cn(
        "absolute inset-0 transition-[visibility]",
        CHANGE_MS,
        active ? "visible z-10" : "invisible z-0",
      )}
    >
      <div className="mx-auto h-full w-full max-w-[1304px] px-6 lg:px-8">
        <div className="relative grid h-full md:grid-cols-[3fr_2fr] lg:grid-cols-12 lg:gap-x-6">
          {/* Text column */}
          <div className="relative z-10 flex flex-col items-start pt-7 md:justify-center md:py-16 lg:pt-44 md:pr-6 lg:col-span-6 lg:pr-0">
            <Reveal active={active} order={0}>
              <Heading className="max-w-[15em] text-[clamp(28px,7.5vw,34px)] leading-[1.1] md:text-[40px] lg:text-[clamp(32px,3.4vw,48px)]">
                {slide.headline.before}
                <em className="font-medium italic">{slide.headline.italic}</em>
                {slide.headline.after}
              </Heading>
            </Reveal>

            <Reveal active={active} order={1} className="mt-3 md:mt-5">
              <p className="line-clamp-2 max-w-[420px] text-[16px] leading-[1.6] md:max-w-[340px] md:text-[18px] lg:max-w-[420px]">
                {slide.text}
              </p>
            </Reveal>

            <Reveal
              active={active}
              order={2}
              className="mt-4 flex flex-col items-start gap-2 md:mt-7 lg:flex-row lg:items-center lg:gap-6"
            >
              <Link
                to={slide.cta.to}
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold whitespace-nowrap transition-colors duration-200",
                  theme.cta,
                )}
              >
                {slide.cta.label}
                <ArrowRight aria-hidden size={18} />
              </Link>
              <Link
                to="/custom-order"
                className={cn(
                  "rounded-sm py-1 text-[15px] font-medium underline underline-offset-4 md:text-[16px]",
                  theme.link,
                )}
              >
                Request a custom order
              </Link>
            </Reveal>

            <Reveal active={active} order={3} className="mt-4 md:mt-10">
              <Controls
                count={count}
                index={index}
                active={active}
                autoplay={autoplay}
                paused={paused}
                stopped={stopped}
                onGo={onGo}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            </Reveal>
          </div>

          {/* Image column: arch rising out of the bottom edge */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-[220px] transition-opacity ease-out md:relative md:h-full",
              CHANGE_MS,
              active ? "opacity-100" : "opacity-0",
              "lg:col-span-6",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute rounded-full",
                theme.circle,
                "-right-10 bottom-10 size-[220px] md:-right-16 md:bottom-[110px] md:size-[360px]",
                "lg:right-auto lg:bottom-[120px] lg:left-1/2 lg:-ml-[120px] lg:size-[420px]",
              )}
            />
            <LeafBranch className="absolute bottom-0 -left-6 hidden h-[340px] opacity-10 md:block lg:h-[380px]" />

            <div className="absolute bottom-[-140px] left-1/2 h-[360px] w-[300px] -translate-x-1/2 md:right-0 md:bottom-0 md:left-auto md:h-[400px] md:w-[340px] md:translate-x-0 lg:right-auto lg:left-1/2 lg:h-[460px] lg:w-[400px] lg:-translate-x-1/2">
              <div
                className={cn(
                  "h-full w-full origin-bottom overflow-hidden rounded-t-full transition-[scale] ease-out",
                  CHANGE_MS,
                  active ? "scale-100" : "scale-[0.98]",
                )}
              >
                <ImageSlot
                  variant="plain"
                  src={slide.image}
                  alt={slide.imageAlt}
                  className={cn(theme.slot, "object-bottom")}
                  loading={position === 0 ? "eager" : "lazy"}
                />
              </div>

              {/* {slide.chips && (
                <ul className="hidden md:block" aria-label="Shop by category">
                  {slide.chips.map((chip, c) => (
                    <li key={chip.label} className={cn("absolute", CHIP_POSITIONS[c])}>
                      <Link
                        to={chip.to}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cream pr-4 pl-3 text-[14px] font-semibold whitespace-nowrap text-deep transition-colors hover:bg-sand"
                      >
                        <Leaf aria-hidden size={16} className="text-forest" />
                        {chip.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )} */}

              {slide.stamp && (
                <div
                  role="img"
                  aria-label={slide.stamp}
                  className="absolute top-[118px] -left-3 grid size-[72px] -rotate-[8deg] place-items-center rounded-full bg-forest text-cream md:top-auto md:bottom-14 md:-left-10 md:size-24"
                >
                  <span
                    aria-hidden
                    className="absolute inset-1.5 rounded-full border border-dashed border-cream/60"
                  />
                  <span
                    aria-hidden
                    className="relative w-[66%] text-center text-[9px] leading-[1.2] font-semibold text-balance md:text-[11px]"
                  >
                    {slide.stamp}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fades up 12px; each block starts 70ms after the previous one. */
function Reveal({
  active,
  order,
  className,
  children,
}: {
  active: boolean;
  order: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "transition-[opacity,translate] ease-out",
        CHANGE_MS,
        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      style={{ transitionDelay: active ? `${order * 70}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

interface ControlsProps {
  count: number;
  index: number;
  active: boolean;
  autoplay: boolean;
  paused: boolean;
  stopped: boolean;
  onGo: (step: number) => void;
  onSelect: (i: number) => void;
  onToggle: () => void;
}

function Controls({
  count,
  index,
  active,
  autoplay,
  paused,
  stopped,
  onGo,
  onSelect,
  onToggle,
}: ControlsProps) {
  const circle =
    "grid size-10 place-items-center rounded-full border border-current/40 transition-colors hover:bg-current/10";
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-4">
      {/* <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => onGo(-1)}
          aria-label="Previous slide"
          className={circle}
        >
          <ArrowLeft aria-hidden size={18} />
        </button>
        <button type="button" onClick={() => onGo(1)} aria-label="Next slide" className={circle}>
          <ArrowRight aria-hidden size={18} />
        </button>
      </div> */}

      {/* <p aria-hidden className="hidden text-[14px] font-medium tabular-nums md:block">
        {pad(index + 1)} / {pad(count)}
      </p> */}

      <div className="flex items-center gap-2">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Show slide ${i + 1} of ${count}`}
            aria-current={i === index ? "true" : undefined}
            className="grid h-6 w-8 place-items-center"
          >
            <span className="relative block h-[3px] w-full overflow-hidden bg-current/25">
              {active && i === index && (
                <span
                  key={index}
                  className="absolute inset-0 origin-left bg-current"
                  style={
                    autoplay
                      ? {
                          animation: `hero-progress ${INTERVAL_MS}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : undefined
                  }
                  onAnimationEnd={() => onGo(1)}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* {autoplay && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={stopped ? "Play slideshow" : "Pause slideshow"}
          className="grid size-8 place-items-center rounded-full transition-colors hover:bg-current/10"
        >
          {stopped ? <Play aria-hidden size={14} /> : <Pause aria-hidden size={14} />}
        </button>
      )} */}
    </div>
  );
}
