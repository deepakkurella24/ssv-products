import { Link } from "react-router";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/delivery";
import { REQUEST_STATUS_HINT, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE } from "@/lib/status";
import { buttonStyles } from "@/lib/ui";
import { useStore } from "@/store/StoreProvider";

export default function RequestsPage() {
  const { customRequests } = useStore();
  const sorted = [...customRequests].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <section aria-labelledby="requests-heading">
      <title>Custom requests · SSV</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="requests-heading" className="text-[28px] lg:text-[32px]">
          My custom requests
        </h2>
        <Link to="/custom-order" className={buttonStyles.outline("h-11 px-5 text-[15px]")}>
          New request
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-6 rounded-card border border-sand bg-sand/40 px-6 py-12">
          <p className="font-display text-[22px] font-semibold">No custom requests yet</p>
          <p className="mt-2 max-w-[460px] text-deep/80">
            Need a larger quantity, or something that is not on the site? Tell us and our team will
            call you.
          </p>
          <Link to="/custom-order" className={buttonStyles.forest("mt-5 h-12 px-6 text-[16px]")}>
            Request a custom order
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {sorted.map((r) => (
            <li key={r.id} className="rounded-card border border-sand p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="font-display text-[20px] leading-snug font-semibold">{r.item}</p>
                  <p className="mt-0.5 text-[14px] text-deep/70">
                    {r.id} · Sent on {formatDate(r.created_at)}
                  </p>
                </div>
                <StatusBadge
                  label={REQUEST_STATUS_LABEL[r.status]}
                  tone={REQUEST_STATUS_TONE[r.status]}
                />
              </div>
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
                <div>
                  <dt className="text-deep/70">Quantity</dt>
                  <dd className="font-semibold tabular-nums">{r.quantity_kg} kg</dd>
                </div>
                <div>
                  <dt className="text-deep/70">We will call</dt>
                  <dd className="font-semibold tabular-nums">+91 {r.mobile}</dd>
                </div>
                {r.details && (
                  <div className="sm:col-span-2">
                    <dt className="text-deep/70">Your details</dt>
                    <dd>{r.details}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 border-t border-sand pt-3 text-[14px] text-deep/80">
                {REQUEST_STATUS_HINT[r.status]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
