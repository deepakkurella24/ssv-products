import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChevronRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  getAnalytics,
  RANGE_OPTIONS,
  type AnalyticsData,
  type Kpi,
  type RangeKey,
} from "@/data/admin/analytics";
import {
  AppBar,
  Card,
  CardTitle,
  ErrorState,
  FilterChips,
  Segmented,
  Skeleton,
} from "@/admin/components/ui";
import { formatINR, formatINRCompact, plural } from "@/admin/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TOKEN, tokenColor } from "@/admin/lib/status";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { cn } from "@/lib/utils";

const FALLBACK: Record<string, string> = {
  "--color-forest": "#1f5a2b",
  "--color-leaf": "#5ba32b",
  "--color-clay": "#8a5a2b",
  "--color-marigold": "#f5b21b",
  "--color-teal": "#1d5c57",
  "--color-brick": "#b3412f",
  "--color-deep": "#14301b",
  "--color-sand": "#efe4c8",
};
const color = (token: string) => tokenColor(token, FALLBACK[token]);

const AXIS_TICK = { fontSize: 11 };

export function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const range = (RANGE_OPTIONS.find((r) => r.value === params.get("range"))?.value ??
    "30d") as RangeKey;
  const { data, error, loading, retry } = useApi(() => getAnalytics(range), [range]);
  const stale = loading && data && data.range !== range;

  return (
    <>
      <title>Analytics · SSV Admin</title>
      <AppBar title="Analytics">
        <FilterChips
          label="Date range"
          value={range}
          onChange={(v) => setParams(v === "30d" ? {} : { range: v }, { replace: true })}
          options={RANGE_OPTIONS}
        />
      </AppBar>
      <div
        className={cn("mx-auto max-w-[1100px] p-4 transition-opacity", stale && "opacity-60")}
        aria-busy={loading}
      >
        {!data && loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-64 w-full md:col-span-2" />
          </div>
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : data ? (
          <Dashboard data={data} />
        ) : null}
      </div>
    </>
  );
}

function Dashboard({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3">
        <KpiGrid data={data} />
        <Attention data={data} />
      </div>
      <RevenueCard data={data} />
      <StatusCard data={data} />
      <TopProductsCard data={data} />
      
      
      <FunnelCard data={data} />
    </div>
  );
}

// ---------------------------------------------------------------- KPIs

function KpiGrid({ data }: { data: AnalyticsData }) {
  const k = data.kpis;
  return (
    <section aria-label="Key numbers">
      <div className="grid grid-cols-2 gap-3">
        <KpiTile
          label="Revenue"
          value={formatINR(k.revenue.value)}
          kpi={k.revenue}
          format={formatINR}
        />
        <KpiTile label="Orders" value={String(k.orders.value)} kpi={k.orders} format={String} />
        <KpiTile
          label="Average order"
          value={formatINR(k.aov.value)}
          kpi={k.aov}
          format={formatINR}
        />
        <KpiTile
          label="Payments to collect"
          value={formatINR(k.toCollect.value)}
          kpi={k.toCollect}
          format={formatINR}
          upIsGood={false}
        />
      </div>
      <p className="mt-2 px-1 text-[13px] text-deep/65">
        Changes are {data.compareLabel.replace(/^vs /, "compared with ")}.
      </p>
    </section>
  );
}

function KpiTile({
  label,
  value,
  kpi,
  format,
  upIsGood = true,
}: {
  label: string;
  value: string;
  kpi: Kpi;
  format: (n: number) => string;
  upIsGood?: boolean;
}) {
  const c = kpi.change;
  // A rise from zero counts as "up".
  const good = c === 0 ? null : (c === null || c > 0) === upIsGood;
  const Icon = c === 0 ? Minus : c === null || c > 0 ? TrendingUp : TrendingDown;
  return (
    <Card className="p-3.5">
      <p className="text-[13px] font-medium text-deep/70">{label}</p>
      <p className="mt-1 truncate text-[22px] leading-tight font-bold tabular-nums">{value}</p>
      <p
        className={cn(
          "mt-1.5 flex items-center gap-1 text-[13px] font-semibold tabular-nums",
          good === null ? "text-deep/60" : good ? "text-forest" : "text-brick",
        )}
      >
        <Icon size={15} />
        {c === null ? `Up from ${format(kpi.previous)}` : `${c > 0 ? "+" : ""}${c}%`}
      </p>
    </Card>
  );
}

function Attention({ data }: { data: AnalyticsData }) {
  const rows = [
    { label: "Pending orders", count: data.attention.pending, to: "/admin/orders?status=pending" },
    { label: "Overdue deliveries", count: data.attention.overdue, to: "/admin/orders?overdue=1" },
    {
      label: "New custom requests",
      count: data.attention.newRequests,
      to: "/admin/requests?status=new",
    },
  ];
  return (
    <Card className="px-4 pt-2 pb-1">
      <CardTitle>Needs attention</CardTitle>
      <ul className="divide-y divide-sand">
        {rows.map((r) => (
          <li key={r.label}>
            <Link to={r.to} className="flex min-h-12 items-center gap-3 py-1.5">
              <span className="flex-1 text-[15px] font-medium">{r.label}</span>
              <span
                className={cn(
                  "grid h-7 min-w-7 place-items-center rounded-full px-2 text-[13px] font-bold tabular-nums",
                  r.count ? "bg-marigold text-deep" : "bg-sand text-deep/60",
                )}
              >
                {r.count}
              </span>
              <ChevronRight size={18} className="text-deep/50" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------- Revenue

function RevenueCard({ data }: { data: AnalyticsData }) {
  const [selected, setSelected] = useState<number | null>(null);
  const series = data.revenue.series;
  const pick = selected !== null && selected < series.length ? series[selected] : null;
  const unit =
    data.revenue.bucket === "hour"
      ? "4-hour blocks"
      : data.revenue.bucket === "day"
        ? "daily"
        : "weekly";
  return (
    <Card className="p-4">
      <CardTitle>Revenue over time</CardTitle>
      <p aria-live="polite" className="min-h-12 text-[15px]">
        {pick ? (
          <>
            <span className="text-deep/70">{pick.detail}</span>
            <br />
            <strong className="text-[18px] tabular-nums">{formatINR(pick.revenue)}</strong>{" "}
            <span className="text-deep/70">· {plural(pick.orders, "order")}</span>
          </>
        ) : (
          <>
            <span className="text-deep/70">Total, shown {unit}. Tap a bar for details.</span>
            <br />
            <strong className="text-[18px] tabular-nums">{formatINR(data.revenue.total)}</strong>
          </>
        )}
      </p>
      <div className="mt-2 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ ...AXIS_TICK, fill: color("--color-deep") }}
              tickLine={false}
              axisLine={{ stroke: color("--color-sand") }}
              interval={series.length > 10 ? 1 : 0}
            />
            <YAxis
              width={44}
              tick={{ ...AXIS_TICK, fill: color("--color-deep") }}
              tickFormatter={(v: number) => formatINRCompact(v)}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="revenue"
              minPointSize={4}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              onClick={(_: unknown, index: number) =>
                setSelected((s) => (s === index ? null : index))
              }
              cursor="pointer"
            >
              {series.map((s, i) => (
                <Cell
                  key={s.key}
                  fill={i === selected ? color("--color-leaf") : color("--color-forest")}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Status

/** One-row stacked bar; small non-zero parts are widened so they stay visible. */
function StackedBar({
  parts,
  label,
}: {
  parts: { key: string; value: number; fill: string }[];
  label: string;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const row: Record<string, number | string> = { name: label };
  for (const p of parts) row[p.key] = p.value > 0 ? Math.max(p.value, total * 0.02) : 0;
  if (total === 0)
    return (
      <div className="h-7 rounded-[6px] bg-sand" aria-label={`${label}: no data`} role="img" />
    );
  return (
    <div
      className="h-7"
      role="img"
      aria-label={`${label}: ${parts
        .filter((p) => p.value)
        .map((p) => `${p.key} ${p.value}`)
        .join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[row]}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" hide />
          {parts.map((p) => (
            <Bar key={p.key} dataKey={p.key} stackId="s" fill={p.fill} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusCard({ data }: { data: AnalyticsData }) {
  const total = data.statuses.reduce((s, x) => s + x.count, 0);
  return (
    <Card className="p-4">
      <CardTitle>Orders by status</CardTitle>
      <StackedBar
        label="Orders by status"
        parts={data.statuses.map((s) => ({
          key: ORDER_STATUS_LABEL[s.status],
          value: s.count,
          fill: color(ORDER_STATUS_TOKEN[s.status]),
        }))}
      />
      <ul className="mt-3 divide-y divide-sand">
        {data.statuses.map((s) => (
          <li key={s.status}>
            <Link
              to={`/admin/orders?status=${s.status}`}
              className="flex min-h-11 items-center gap-3"
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ background: color(ORDER_STATUS_TOKEN[s.status]) }}
              />
              <span className="flex-1 text-[15px]">{ORDER_STATUS_LABEL[s.status]}</span>
              <span className="text-[15px] font-semibold tabular-nums">{s.count}</span>
              <span className="w-10 text-right text-[13px] text-deep/60 tabular-nums">
                {total ? Math.round((s.count / total) * 100) : 0}%
              </span>
              <ChevronRight size={18} className="text-deep/50" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------- Products

function TopProductsCard({ data }: { data: AnalyticsData }) {
  const [by, setBy] = useState<"units" | "revenue">("units");
  const list = data.topProducts[by];
  const max = Math.max(1, ...list.map((p) => p.value));
  return (
    <Card className="p-4">
      <CardTitle>Top products</CardTitle>
      <Segmented
        label="Rank by"
        value={by}
        onChange={setBy}
        options={[
          { value: "units", label: "Units" },
          { value: "revenue", label: "Revenue" },
        ]}
      />
      {list.length === 0 ? (
        <p className="py-6 text-center text-[15px] text-deep/70">No sales in this period yet.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {list.map((p, i) => (
            <li key={p.id}>
              <div className="flex items-baseline gap-2 text-[15px]">
                <span className="w-5 shrink-0 font-bold text-deep/60 tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <span className="font-semibold tabular-nums">
                  {by === "units" ? plural(p.value, "unit") : formatINR(p.value)}
                </span>
              </div>
              <div className="mt-1.5 ml-7 h-1.5 rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${Math.max(2, (p.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- Collection

function CollectionCard({ data }: { data: AnalyticsData }) {
  const c = data.collection;
  const total = c.codAmount + c.onlineAmount;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <Card className="p-4">
      <CardTitle>Collection</CardTitle>
      <StackedBar
        label="COD versus online"
        parts={[
          { key: "COD", value: c.codAmount, fill: color("--color-forest") },
          { key: "Online", value: c.onlineAmount, fill: color("--color-leaf") },
        ]}
      />
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[14px]">
        <div className="flex gap-2">
          <span aria-hidden className="mt-1 size-3 shrink-0 rounded-full bg-forest" />
          <div>
            <dt className="font-semibold">COD · {pct(c.codAmount)}%</dt>
            <dd className="text-deep/70 tabular-nums">
              {formatINR(c.codAmount)} · {plural(c.codOrders, "order")}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <span aria-hidden className="mt-1 size-3 shrink-0 rounded-full bg-leaf" />
          <div>
            <dt className="font-semibold">Online · {pct(c.onlineAmount)}%</dt>
            <dd className="text-deep/70 tabular-nums">
              {formatINR(c.onlineAmount)} · {plural(c.onlineOrders, "order")}
            </dd>
          </div>
        </div>
      </dl>
      <p className="mt-4 rounded-[10px] bg-sand/50 px-3 py-2.5 text-[15px] tabular-nums">
        Collected <strong>{formatINR(c.collected)}</strong>, still due{" "}
        <strong>{formatINR(c.due)}</strong>
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------- Zones

function ZonesCard({ data }: { data: AnalyticsData }) {
  const rows = useMemo(() => data.zones.map((z) => ({ ...z })), [data.zones]);
  return (
    <Card className="p-4">
      <CardTitle>Orders by delivery zone</CardTitle>
      <div className="h-[152px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              tick={{ ...AXIS_TICK, fill: color("--color-deep") }}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="count"
              fill={color("--color-forest")}
              minPointSize={4}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 11, fill: color("--color-deep"), fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[13px] text-deep/60">
        For reporting only. Zones don't change prices.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------- Funnel

function FunnelCard({ data }: { data: AnalyticsData }) {
  const f = data.funnel;
  const max = Math.max(1, f.new);
  const steps = [
    { label: "New", value: f.new, fill: "bg-forest" },
    { label: "Contacted", value: f.contacted, fill: "bg-leaf" },
    { label: "Confirmed", value: f.confirmed, fill: "bg-clay" },
  ];
  return (
    <Card className="p-4">
      <CardTitle
        action={
          <span className="text-[14px] font-semibold tabular-nums">
            {f.conversion === null ? "No requests" : `${f.conversion}% converted`}
          </span>
        }
      >
        Custom requests
      </CardTitle>
      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.label}>
            <div className="flex justify-between text-[15px]">
              <span>{s.label}</span>
              <span className="font-semibold tabular-nums">{s.value}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-sand">
              <div
                className={cn("h-full rounded-full", s.fill)}
                style={{ width: `${s.value ? Math.max(3, (s.value / max) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-deep/60">
        Requests received in this period, by the furthest step they reached.
      </p>
    </Card>
  );
}
