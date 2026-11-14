"use client";
export default function StatusPanel({
  title = "Loading",
  message,
  retry,
  kind = "loading",
}) {
  return (
    <div
      className="rounded-card border border-sand bg-sand/30 p-8 text-center"
      role={kind === "error" ? "alert" : undefined}
    >
      <div className="mx-auto mb-3 h-8 w-8">
        {kind === "loading" ? (
          <span className="block h-8 w-8 animate-pulse rounded-full bg-sand-dark" />
        ) : null}
      </div>
      <h2 className="font-display text-2xl">{title}</h2>
      {message && <p className="mt-2 text-deep/75">{message}</p>}
      {kind === "error" && (
        <button
          onClick={retry || (() => window.location.reload())}
          className="button-outline mt-5"
        >
          Retry
        </button>
      )}
    </div>
  );
}
