"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/delivery";
import { REQUEST_STATUS_HINT, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE } from "@/lib/status";
import { buttonStyles } from "@/lib/ui";
import { getMyCustomRequests } from "@/lib/api/user";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RequestsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [customRequests, setCustomRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      setCustomRequests([]);
      setLoading(false);
      return;
    }

    let active = true;
    firebaseUser
      .getIdToken()
      .then((token) => getMyCustomRequests(token))
      .then((data) => {
        if (active) setCustomRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCustomRequests([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [firebaseUser, authLoading]);

  const sorted = [...customRequests].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  return (
    <section aria-labelledby="requests-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="requests-heading" className="text-[28px] lg:text-[32px]">
          My custom requests
        </h2>
        <Link href="/custom-order" className={buttonStyles.outline("h-11 px-5 text-[15px]")}>
          New request
        </Link>
      </div>

      {loading || authLoading ? (
        <div className="mt-6 py-12 text-center text-[16px] text-deep/70">
          Loading custom requests…
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-6 rounded-card border border-sand bg-sand/40 px-6 py-12">
          <p className="font-display text-[22px] font-semibold">No custom requests yet</p>
          <p className="mt-2 max-w-[460px] text-deep/80">
            Need a larger quantity, or something that is not on the site? Tell us and our team will
            call you.
          </p>
          <Link href="/custom-order" className={buttonStyles.forest("mt-5 h-12 px-6 text-[16px]")}>
            Request a custom order
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {sorted.map((r) => (
            <li key={r.id} className="rounded-card border border-sand p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="font-display text-[20px] leading-snug font-semibold">{r.item || r.preferred_product || "Custom Order Request"}</p>
                  <p className="mt-0.5 text-[14px] text-deep/70">
                    {r.id} · Sent on {formatDate(r.created_at)}
                  </p>
                </div>
                <StatusBadge
                  label={REQUEST_STATUS_LABEL[r.status] || r.status}
                  tone={REQUEST_STATUS_TONE[r.status] || "sand"}
                />
              </div>
              <RequestProgress status={r.status} />
              <dl className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
                <div>
                  <dt className="text-deep/70">Quantity</dt>
                  <dd className="font-semibold tabular-nums">{r.quantity_kg} kg</dd>
                </div>
                <div>
                  <dt className="text-deep/70">We will call</dt>
                  <dd className="font-semibold tabular-nums">+91 {r.mobile}</dd>
                </div>
                {(r.details || r.customization_text) && (
                  <div className="sm:col-span-2">
                    <dt className="text-deep/70">Your details</dt>
                    <dd>{r.details || r.customization_text}</dd>
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

function RequestProgress({ status }) {
  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled" || status === "closed";
  const decided = isConfirmed || isCancelled;
  const outcome = isCancelled ? "Rejected" : isConfirmed ? "Confirmed" : "Awaiting decision";
  const outcomeColor = isCancelled ? "border-2 border-clay bg-white text-clay" : "bg-forest text-cream";

  return (
    <ol aria-label="Request progress" className="mt-5 grid grid-cols-2">
      <li aria-current={!decided ? "step" : undefined} className="relative flex flex-col items-center text-center">
        <span className={`relative z-10 grid size-7 place-items-center rounded-full text-[12px] font-bold ${decided ? "bg-forest text-cream" : "bg-leaf text-deep ring-4 ring-leaf/20"}`}>
          {decided ? "✓" : "1"}
        </span>
        <span className="mt-1.5 text-[12px] font-semibold">Request received</span>
      </li>
      <li aria-current={decided ? "step" : undefined} className="relative flex flex-col items-center text-center">
        <span aria-hidden className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 ${decided ? (isCancelled ? "bg-clay" : "bg-forest") : "bg-sand"}`} />
        <span className={`relative z-10 grid size-7 place-items-center rounded-full text-[12px] font-bold ${decided ? outcomeColor : "border-2 border-sand bg-white text-deep/50"}`}>
          {decided ? "✓" : "2"}
        </span>
        <span className={`mt-1.5 text-[12px] ${decided ? "font-semibold" : "text-deep/70"}`}>{outcome}</span>
      </li>
    </ol>
  );
}
