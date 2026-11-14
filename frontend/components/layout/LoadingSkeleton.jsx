export default function LoadingSkeleton() {
  return (
    <div
      className="shell animate-pulse py-12"
      aria-label="Loading"
      role="status"
    >
      <div className="h-9 w-56 rounded-lg bg-sand" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-card border border-sand"
          >
            <div className="aspect-square bg-sand/80" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-4/5 rounded bg-sand" />
              <div className="h-4 w-2/5 rounded bg-sand" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
