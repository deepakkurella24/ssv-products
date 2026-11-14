// All admin analytics are derived here from the orders and custom requests data.
// Chart components only render the results.
import { readDb, simulateRequest, type AdminDb } from "./db";
import { amountDue, isOverdue } from "./orders";
import type { AdminOrder, DeliveryZone, OrderStatus } from "./types";

export type RangeKey = "today" | "7d" | "30d" | "month";

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "month", label: "This month" },
];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const dayLabel = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

interface Period {
  start: number;
  end: number;
}

export interface Kpi {
  value: number;
  previous: number;
  /** Percentage change versus the previous period; null when there is nothing to compare. */
  change: number | null;
}

export interface RevenueBucket {
  key: string;
  label: string;
  detail: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsData {
  range: RangeKey;
  compareLabel: string;
  kpis: { revenue: Kpi; orders: Kpi; aov: Kpi; toCollect: Kpi };
  attention: { pending: number; overdue: number; newRequests: number };
  revenue: { bucket: "hour" | "day" | "week"; series: RevenueBucket[]; total: number };
  statuses: { status: OrderStatus; count: number }[];
  topProducts: { units: RankedProduct[]; revenue: RankedProduct[] };
  collection: {
    codAmount: number;
    onlineAmount: number;
    codOrders: number;
    onlineOrders: number;
    collected: number;
    due: number;
  };
  zones: { zone: DeliveryZone; label: string; count: number }[];
  funnel: { new: number; contacted: number; confirmed: number; conversion: number | null };
}

export interface RankedProduct {
  id: string;
  name: string;
  value: number;
}

export const ZONE_LABEL: Record<DeliveryZone, string> = {
  same_city: "Same city",
  same_state: "Same state",
  nearby_states: "Nearby states",
  other_states: "Other states",
};

function periodsFor(
  range: RangeKey,
  now: number,
): { current: Period; previous: Period; compareLabel: string } {
  const today = startOfDay(now);
  switch (range) {
    case "today":
      return {
        current: { start: today, end: now },
        previous: { start: today - DAY, end: now - DAY },
        compareLabel: "vs yesterday",
      };
    case "7d": {
      const start = today - 6 * DAY;
      return {
        current: { start, end: now },
        previous: { start: start - 7 * DAY, end: start },
        compareLabel: "vs previous 7 days",
      };
    }
    case "30d": {
      const start = today - 29 * DAY;
      return {
        current: { start, end: now },
        previous: { start: start - 30 * DAY, end: start },
        compareLabel: "vs previous 30 days",
      };
    }
    case "month": {
      const d = new Date(now);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
      const elapsed = now - start;
      return {
        current: { start, end: now },
        previous: { start: prevStart, end: Math.min(prevStart + elapsed, start) },
        compareLabel: "vs same days last month",
      };
    }
  }
}

const inPeriod = (iso: string, p: Period) => {
  const t = new Date(iso).getTime();
  return t >= p.start && t < p.end + 1;
};

const change = (value: number, previous: number): number | null =>
  previous === 0
    ? value === 0
      ? 0
      : null
    : Math.round(((value - previous) / previous) * 1000) / 10;

function summarise(orders: AdminOrder[]) {
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  return {
    revenue,
    orders: orders.length,
    aov: live.length ? Math.round(revenue / live.length) : 0,
    toCollect: live.reduce((s, o) => s + amountDue(o), 0),
  };
}

function revenueSeries(
  range: RangeKey,
  period: Period,
  orders: AdminOrder[],
): AnalyticsData["revenue"] {
  const live = orders.filter((o) => o.status !== "cancelled");
  const sum = (from: number, to: number) => {
    const inside = live.filter((o) => {
      const t = new Date(o.placed_at).getTime();
      return t >= from && t < to;
    });
    return { revenue: inside.reduce((s, o) => s + o.total, 0), orders: inside.length };
  };

  let bucket: "hour" | "day" | "week";
  const series: RevenueBucket[] = [];
  const days = Math.round((startOfDay(period.end) - period.start) / DAY) + 1;

  if (range === "today") {
    bucket = "hour";
    for (let h = 0; h < 24; h += 4) {
      const from = period.start + h * HOUR;
      series.push({
        key: String(h),
        label: hourLabel(h),
        detail: `${hourLabel(h)}–${hourLabel((h + 4) % 24)}`,
        ...sum(from, from + 4 * HOUR),
      });
    }
  } else if (days <= 14) {
    bucket = "day";
    for (let i = 0; i < days; i++) {
      const from = period.start + i * DAY;
      const d = new Date(from);
      series.push({
        key: String(from),
        label: range === "7d" ? WEEKDAYS[d.getDay()] : String(d.getDate()),
        detail: `${WEEKDAYS[d.getDay()]}, ${dayLabel(from)}`,
        ...sum(from, from + DAY),
      });
    }
  } else {
    bucket = "week";
    // Whole weeks ending today; the oldest week may be partial.
    const endDay = startOfDay(period.end) + DAY;
    for (let to = endDay; to > period.start; to -= 7 * DAY) {
      const from = Math.max(period.start, to - 7 * DAY);
      series.unshift({
        key: String(from),
        label: dayLabel(from),
        detail: `${dayLabel(from)} – ${dayLabel(to - DAY)}`,
        ...sum(from, to),
      });
    }
  }
  return { bucket, series, total: series.reduce((s, b) => s + b.revenue, 0) };
}

export function computeAnalytics(db: AdminDb, range: RangeKey, now = Date.now()): AnalyticsData {
  const { current, previous, compareLabel } = periodsFor(range, now);
  const cur = db.orders.filter((o) => inPeriod(o.placed_at, current));
  const prev = db.orders.filter((o) => inPeriod(o.placed_at, previous));
  const a = summarise(cur);
  const b = summarise(prev);
  const live = cur.filter((o) => o.status !== "cancelled");

  const statusOrder: OrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  const products = new Map<string, { id: string; name: string; units: number; revenue: number }>();
  for (const o of live) {
    for (const it of o.items) {
      const key = it.product_id ?? it.name;
      const entry = products.get(key) ?? { id: key, name: it.name, units: 0, revenue: 0 };
      entry.units += it.qty;
      entry.revenue += it.qty * it.price;
      products.set(key, entry);
    }
  }
  const ranked = (by: "units" | "revenue") =>
    [...products.values()]
      .sort((x, y) => y[by] - x[by])
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, value: p[by] }));

  const cod = live.filter((o) => o.payment_method === "cod");
  const online = live.filter((o) => o.payment_method === "online");

  const requests = db.requests.filter((r) => inPeriod(r.received_at, current));
  const reached = (s: "contacted" | "confirmed") =>
    requests.filter((r) =>
      r.status_history.some(
        (e) => e.status === s || (s === "contacted" && e.status === "confirmed"),
      ),
    ).length;
  const confirmed = reached("confirmed");

  return {
    range,
    compareLabel,
    kpis: {
      revenue: { value: a.revenue, previous: b.revenue, change: change(a.revenue, b.revenue) },
      orders: { value: a.orders, previous: b.orders, change: change(a.orders, b.orders) },
      aov: { value: a.aov, previous: b.aov, change: change(a.aov, b.aov) },
      toCollect: {
        value: a.toCollect,
        previous: b.toCollect,
        change: change(a.toCollect, b.toCollect),
      },
    },
    attention: {
      pending: db.orders.filter((o) => o.status === "pending").length,
      overdue: db.orders.filter((o) => isOverdue(o, now)).length,
      newRequests: db.requests.filter((r) => r.status === "new").length,
    },
    revenue: revenueSeries(range, current, cur),
    statuses: statusOrder.map((status) => ({
      status,
      count: cur.filter((o) => o.status === status).length,
    })),
    topProducts: { units: ranked("units"), revenue: ranked("revenue") },
    collection: {
      codAmount: cod.reduce((s, o) => s + o.total, 0),
      onlineAmount: online.reduce((s, o) => s + o.total, 0),
      codOrders: cod.length,
      onlineOrders: online.length,
      collected: live.reduce((s, o) => s + Math.min(o.amount_paid, o.total), 0),
      due: live.reduce((s, o) => s + amountDue(o), 0),
    },
    zones: (Object.keys(ZONE_LABEL) as DeliveryZone[]).map((zone) => ({
      zone,
      label: ZONE_LABEL[zone],
      count: live.filter((o) => o.delivery_zone === zone).length,
    })),
    funnel: {
      new: requests.length,
      contacted: reached("contacted"),
      confirmed,
      conversion: requests.length ? Math.round((confirmed / requests.length) * 100) : null,
    },
  };
}

export async function getAnalytics(range: RangeKey): Promise<AnalyticsData> {
  await simulateRequest(260);
  return computeAnalytics(readDb(), range);
}
