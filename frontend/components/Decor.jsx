import { cn } from "@/lib/utils";

/** Curved underline swoosh from the reference, drawn as a tapered stroke. */
export function Swoosh({ className }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 420 26"
      preserveAspectRatio="none"
      className={cn("block", className)}
      fill="currentColor"
    >
      <path d="M2 22C96 4 250-2 418 12c-150-6-290 0-416 10Z" />
    </svg>
  );
}

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const point = {
    x: u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y,
  };
  const tangent = {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
  return { point, angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI };
}

const STEM = [
  { x: 40, y: 470 },
  { x: 150, y: 360 },
  { x: 190, y: 220 },
  { x: 330, y: 30 },
];

const LEAVES = [0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.93].map((t, i) => {
  const { point, angle } = bezier(...STEM, t);
  const side = i % 2 === 0 ? -1 : 1;
  return {
    x: Number(point.x.toFixed(2)),
    y: Number(point.y.toFixed(2)),
    angle: Number((angle + side * 48).toFixed(2)),
    scale: Number((1.15 - t * 0.45).toFixed(3)),
  };
});

/** Simple leaf branch line art for the custom order banner. */
export function LeafBranch({ className }) {
  const [p0, p1, p2, p3] = STEM;
  return (
    <svg
      aria-hidden
      viewBox="0 0 380 500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d={`M${p0.x} ${p0.y}C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
        vectorEffect="non-scaling-stroke"
      />
      {LEAVES.map((leaf, i) => (
        <g
          key={i}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle}) scale(${leaf.scale})`}
        >
          <path d="M0 0C18-17 56-19 78 0C56 19 18 17 0 0Z" vectorEffect="non-scaling-stroke" />
          <path d="M4 0H66" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}
