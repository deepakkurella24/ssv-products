"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/delivery";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/status";
import { buttonStyles } from "@/lib/ui";
import { formatPrice } from "@/lib/utils";
import { getOrders } from "@/lib/api/user";
import { useAuth } from "@/components/providers/AuthProvider";

export default function OrdersPage() {
  const pageSize = 10;
  const { firebaseUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let active = true;
    firebaseUser
      .getIdToken()
      .then((token) => getOrders(token))
      .then((data) => {
        if (active) setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [firebaseUser, authLoading]);

  const sorted = [...orders].sort((a, b) => (b.placed_at || "").localeCompare(a.placed_at || ""));
  const pageOrders = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="text-[28px] lg:text-[32px]">
        My orders
      </h2>

      {loading || authLoading ? (
        <div className="mt-6 py-12 text-center text-[16px] text-deep/70">
          Loading your orders…
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-6 rounded-card border border-sand bg-sand/40 px-6 py-12">
          <p className="font-display text-[22px] font-semibold">You have not placed an order yet</p>
          <p className="mt-2 text-deep/80">When you do, you can follow it here.</p>
          <Link href="/products" className={buttonStyles.forest("mt-5 h-12 px-6 text-[16px]")}>
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {pageOrders.map((order) => (
            <li
              key={order.id}
              className="rounded-card border border-sand p-5 transition-shadow hover:shadow-warm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div>
                  <p className="font-display text-[20px] leading-tight font-semibold tabular-nums">
                    {order.id}
                  </p>
                  <p className="text-[14px] text-deep/70">
                    Placed on {formatDate(order.placed_at)}
                  </p>
                </div>
                <StatusBadge
                  label={ORDER_STATUS_LABEL[order.status] || order.status}
                  tone={ORDER_STATUS_TONE[order.status] || "sand"}
                />
              </div>
              <p className="mt-3 line-clamp-2 text-[15px] text-deep/85">
                {(order.items || []).map((i) => `${i.name} (${i.variant_label}) × ${i.qty}`).join(", ")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand pt-4">
                <p className="text-[15px]">
                  Total <strong className="tabular-nums">{formatPrice(order.total)}</strong>
                </p>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-forest underline-offset-4 hover:underline"
                >
                  View order <ArrowRight aria-hidden size={16} />
                  <span className="sr-only">{order.id}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && sorted.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
      )}
    </section>
  );
}
