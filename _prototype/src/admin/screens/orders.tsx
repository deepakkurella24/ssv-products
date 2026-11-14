import { useMemo, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  CalendarClock,
  Check,
  ChevronRight,
  CircleX,
  Copy,
  ListChecks,
  MessageCircle,
  Phone,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import {
  amountDue,
  filterOrders,
  getOrderById,
  getOrders,
  isOverdue,
  itemCount,
  nextStatuses,
  ORDER_STEPS,
  recordOrderPayment,
  updateExpectedDelivery,
  updateOrderStatus,
  type OrderFilters,
} from "@/data/admin/orders";
import type { AdminOrder, OrderStatus } from "@/data/admin/types";
import { PaymentChip, StatusChip, Tag } from "@/admin/components/chips";
import { ConfirmSheet, OptionRow, Sheet } from "@/admin/components/sheet";
import { SplitLayout } from "@/admin/components/SplitLayout";
import { useToast } from "@/admin/components/toast";
import {
  ActionBar,
  AppBar,
  buttonClass,
  Card,
  CardTitle,
  DetailPlaceholder,
  EmptyState,
  ErrorState,
  FilterChips,
  IconButton,
  ListSkeleton,
  SearchRow,
  Segmented,
  Skeleton,
  Switch,
  TextField,
  Thumb,
  usePaged,
} from "@/admin/components/ui";
import {
  formatAddress,
  formatDateTime,
  formatDay,
  formatINR,
  formatPhone,
  fromDateInput,
  plural,
  telHref,
  timeAgo,
  toDateInput,
  whatsappHref,
} from "@/admin/lib/format";
import { NEXT_STEP_LABEL, ORDER_STATUS_LABEL } from "@/admin/lib/status";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { useImmersive } from "@/admin/shell/ShellContext";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// ---------------------------------------------------------------- Section

export function OrdersSection() {
  const { id } = useParams();
  return (
    <>
      <title>Orders · SSV Admin</title>
      <SplitLayout
        hasDetail={!!id}
        list={<OrdersList selectedId={id} wide={!id} />}
        detail={<Outlet />}
        placeholder={
          <DetailPlaceholder
            icon={ReceiptText}
            text="Select an order to see its details and update it."
          />
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- List

function useOrderFilters() {
  const [params, setParams] = useSearchParams();
  const filters: Required<OrderFilters> = {
    status: (params.get("status") as OrderStatus | null) ?? "all",
    query: params.get("q") ?? "",
    overdue: params.get("overdue") === "1",
    payment: (params.get("payment") as OrderFilters["payment"]) ?? "any",
    method: (params.get("method") as OrderFilters["method"]) ?? "any",
  };
  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };
  return { filters, set, search: params.toString() ? `?${params.toString()}` : "" };
}

function OrdersList({ selectedId, wide }: { selectedId?: string; wide: boolean }) {
  const { filters, set, search } = useOrderFilters();
  const [searchOpen, setSearchOpen] = useState(!!filters.query);
  const [filterOpen, setFilterOpen] = useState(false);
  const { data, error, loading, retry } = useApi(getOrders, []);
  const now = Date.now();

  const { base, counts } = useMemo(() => {
    const b = filterOrders(data ?? [], { ...filters, status: "all" }, now);
    const c: Record<string, number> = { all: b.length };
    for (const o of b) c[o.status] = (c[o.status] ?? 0) + 1;
    return { base: b, counts: c };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters.query, filters.overdue, filters.payment, filters.method]);

  const list = filters.status === "all" ? base : base.filter((o) => o.status === filters.status);
  const extraFilters = [
    filters.overdue && { key: "overdue", label: "Overdue" },
    filters.payment !== "any" && {
      key: "payment",
      label: filters.payment === "due" ? "Amount due" : "Fully paid",
    },
    filters.method !== "any" && {
      key: "method",
      label: filters.method === "cod" ? "COD" : "Online",
    },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <>
      <AppBar
        title="Orders"
        actions={
          <>
            <IconButton
              label={searchOpen ? "Close search" : "Search orders"}
              aria-pressed={searchOpen}
              onClick={() => {
                if (searchOpen) set({ q: null });
                setSearchOpen((v) => !v);
              }}
            >
              <Search size={22} />
            </IconButton>
            <IconButton label="Filter orders" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={22} />
              {extraFilters.length > 0 && (
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-marigold ring-2 ring-cream" />
              )}
            </IconButton>
          </>
        }
      >
        {searchOpen && (
          <SearchRow
            label="Search by order number"
            placeholder="Order number, e.g. 1042"
            inputMode="numeric"
            value={filters.query}
            onChange={(v) => set({ q: v.trim() || null })}
          />
        )}
        <FilterChips
          label="Filter by status"
          value={filters.status}
          onChange={(v) => set({ status: v === "all" ? null : v })}
          options={STATUS_FILTERS.map((s) => ({
            value: s,
            label: s === "all" ? "All" : ORDER_STATUS_LABEL[s],
            count: data ? (counts[s] ?? 0) : undefined,
          }))}
        />
        {extraFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
            {extraFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => set({ [f.key]: null })}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-[13px] font-semibold"
                aria-label={`Remove filter ${f.label}`}
              >
                {f.label} <CircleX size={15} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => set({ overdue: null, payment: null, method: null })}
              className={buttonClass("ghost", "h-9 text-[13px]")}
            >
              Clear all
            </button>
          </div>
        )}
      </AppBar>

      <div className="p-4">
        {loading && !data ? (
          <ListSkeleton />
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={filters.query ? Search : ReceiptText}
            title={filters.query ? `No order #${filters.query.replace("#", "")}` : "No orders here"}
            text={
              filters.query
                ? "Check the order number and try again."
                : filters.status === "pending"
                  ? "You're all caught up. New orders will appear here."
                  : "No orders match these filters."
            }
          />
        ) : (
          <OrderResults
            key={`${filters.status}-${filters.query}-${extraFilters.length}`}
            orders={list}
            wide={wide}
            selectedId={selectedId}
            search={search}
            now={now}
          />
        )}
      </div>

      {filterOpen && (
        <Sheet
          open
          onClose={() => setFilterOpen(false)}
          title="Filter orders"
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => set({ overdue: null, payment: null, method: null })}
                className={buttonClass("secondary", "flex-1")}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className={buttonClass("primary", "flex-[2]")}
              >
                Show {plural(list.length, "order")}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[15px] font-semibold">Payment</p>
              <Segmented
                label="Payment"
                value={filters.payment}
                onChange={(v) => set({ payment: v === "any" ? null : v })}
                options={[
                  { value: "any", label: "Any" },
                  { value: "due", label: "Amount due" },
                  { value: "paid", label: "Fully paid" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-[15px] font-semibold">Payment method</p>
              <Segmented
                label="Payment method"
                value={filters.method}
                onChange={(v) => set({ method: v === "any" ? null : v })}
                options={[
                  { value: "any", label: "Any" },
                  { value: "cod", label: "COD" },
                  { value: "online", label: "Online" },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-sand bg-white px-4 py-1">
              <div>
                <p className="text-[15px] font-semibold">Overdue only</p>
                <p className="text-[13px] text-deep/65">Past expected delivery, not delivered</p>
              </div>
              <Switch
                label="Overdue only"
                checked={filters.overdue}
                onChange={(v) => set({ overdue: v ? "1" : null })}
              />
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}

function OrderResults({
  orders,
  wide,
  selectedId,
  search,
  now,
}: {
  orders: AdminOrder[];
  wide: boolean;
  selectedId?: string;
  search: string;
  now: number;
}) {
  const paged = usePaged(orders, 30);
  const navigate = useNavigate();
  return (
    <>
      <ul className={cn("space-y-3", wide && "lg:hidden")}>
        {paged.visible.map((o) => (
          <li key={o.id}>
            <OrderCard
              order={o}
              to={`/admin/orders/${o.id}${search}`}
              selected={o.id === selectedId}
              now={now}
            />
          </li>
        ))}
      </ul>

      {wide && (
        <Card className="hidden overflow-hidden lg:block">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-sand bg-sand/40 text-[12px] tracking-[0.04em] text-deep/70 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Expected</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {paged.visible.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/admin/orders/${o.id}${search}`)}
                  className="cursor-pointer hover:bg-sand/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${o.id}${search}`}
                      className="font-semibold tabular-nums hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{o.id}
                    </Link>
                    <span className="block text-[12px] text-deep/60">
                      {timeAgo(o.placed_at, now)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.customer.name}
                    {o.source_request_id && (
                      <span className="ml-2">
                        <Tag>Custom</Tag>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{plural(itemCount(o), "item")}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentChip order={o} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDay(o.expected_delivery)}
                    {isOverdue(o, now) && (
                      <span className="ml-2">
                        <Tag tone="warning">Overdue</Tag>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatINR(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {paged.hasMore && (
        <button
          type="button"
          onClick={paged.more}
          className={buttonClass("secondary", "mt-4 w-full")}
        >
          Show more ({paged.remaining} left)
        </button>
      )}
    </>
  );
}

function OrderCard({
  order: o,
  to,
  selected,
  now,
}: {
  order: AdminOrder;
  to: string;
  selected: boolean;
  now: number;
}) {
  return (
    <Link
      to={to}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "block rounded-card border bg-white p-4 transition-colors hover:border-deep/30",
        selected ? "border-forest ring-1 ring-forest" : "border-sand",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[16px] font-bold tabular-nums">
          #{o.id}
          <span className="ml-2 text-[13px] font-normal text-deep/60">
            {timeAgo(o.placed_at, now)}
          </span>
        </p>
        <p className="text-[16px] font-bold tabular-nums">{formatINR(o.total)}</p>
      </div>
      <p className="mt-0.5 truncate text-[15px]">{o.customer.name}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusChip status={o.status} />
        <PaymentChip order={o} />
        {isOverdue(o, now) && <Tag tone="warning">Overdue</Tag>}
        {o.source_request_id && <Tag>Custom</Tag>}
      </div>
      <p className="mt-2 text-[13px] text-deep/70">
        {plural(itemCount(o), "item")} ·{" "}
        {o.status === "delivered" && o.delivered_at
          ? `Delivered ${formatDay(o.delivered_at)}`
          : `Expected ${formatDay(o.expected_delivery)}`}
      </p>
    </Link>
  );
}

// ---------------------------------------------------------------- Detail

export function OrderDetailRoute() {
  const { id } = useParams();
  return <OrderDetail key={id} id={id!} />;
}

type SheetName = "progress" | "payment" | "delivery" | null;

function OrderDetail({ id }: { id: string }) {
  useImmersive();
  const location = useLocation();
  const backTo = `/admin/orders${location.search}`;
  const toast = useToast();
  const { data: order, loading, error, retry } = useApi(() => getOrderById(id), [id]);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [busy, setBusy] = useState(false);

  if (loading && order === undefined) {
    return (
      <>
        <AppBar title={`#${id}`} backTo={backTo} backLabel="Back to orders" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }
  if (error && order === undefined) {
    return (
      <>
        <AppBar title={`#${id}`} backTo={backTo} backLabel="Back to orders" />
        <ErrorState message={errorMessage(error)} onRetry={retry} />
      </>
    );
  }
  if (!order) {
    return (
      <>
        <AppBar title="Order not found" backTo={backTo} backLabel="Back to orders" />
        <EmptyState
          icon={ReceiptText}
          title={`We couldn't find order #${id}`}
          text="It may have been typed incorrectly."
          action={
            <Link to="/admin/orders" className={buttonClass("secondary")}>
              All orders
            </Link>
          }
        />
      </>
    );
  }

  const due = amountDue(order);
  const options = nextStatuses(order.status);
  const overdue = isOverdue(order);
  const mainNext = options.find((s) => s !== "cancelled");

  const advance = async (next: OrderStatus) => {
    setBusy(true);
    try {
      await updateOrderStatus(order.id, next);
      toast({ message: `Order #${order.id} moved to ${ORDER_STATUS_LABEL[next]}` });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const onPrimary = () => {
    if (!mainNext) return;
    if (mainNext === "delivered" && due > 0) setSheet("progress");
    else advance(mainNext);
  };

  return (
    <div className="flex min-h-svh flex-col md:min-h-full">
      <title>{`Order #${order.id} · SSV Admin`}</title>
      <AppBar
        title={`#${order.id}`}
        backTo={backTo}
        backLabel="Back to orders"
        actions={
          <span className="pr-2">
            <StatusChip status={order.status} />
          </span>
        }
      />

      <div className="flex-1 space-y-3 p-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] text-deep/70">Placed {formatDateTime(order.placed_at)}</p>
            <div className="flex gap-1.5">
              {overdue && <Tag tone="warning">Overdue</Tag>}
              {order.source_request_id && <Tag>Custom</Tag>}
            </div>
          </div>
          {order.status === "cancelled" ? (
            <div
              role="status"
              className="mt-3 flex items-start gap-3 rounded-[10px] bg-brick/10 p-3 text-brick"
            >
              <CircleX size={22} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Order cancelled</p>
                <p className="text-[14px]">
                  {formatDateTime(
                    order.status_history.find((e) => e.status === "cancelled")?.at ??
                      order.placed_at,
                  )}
                  . It won't be delivered.
                </p>
              </div>
            </div>
          ) : (
            <OrderStepper status={order.status} />
          )}
          {order.status === "delivered" && order.delivered_at && (
            <p className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-forest">
              <Check size={16} /> Delivered on {formatDateTime(order.delivered_at)}
            </p>
          )}
          {order.source_request_id && (
            <Link
              to={`/admin/requests/${order.source_request_id}`}
              className="mt-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-forest underline underline-offset-4"
            >
              From custom request {order.source_request_id}
            </Link>
          )}
        </Card>

        {/* Editing actions */}
        <Card className="divide-y divide-sand overflow-hidden">
          <ActionRow
            icon={<ListChecks size={22} />}
            title="Update progress"
            text={
              options.length
                ? `Next: ${options.map((s) => ORDER_STATUS_LABEL[s]).join(" or ")}`
                : order.status === "delivered"
                  ? "Delivered. No further steps."
                  : "Cancelled. No further steps."
            }
            disabled={!options.length}
            onClick={() => setSheet("progress")}
          />
          <ActionRow
            icon={<Wallet size={22} />}
            title="Record payment received"
            text={
              order.status === "cancelled"
                ? "Order cancelled"
                : `Paid ${formatINR(order.amount_paid)}, due ${formatINR(due)}`
            }
            disabled={order.status === "cancelled" || due === 0}
            onClick={() => setSheet("payment")}
          />
          <ActionRow
            icon={<CalendarClock size={22} />}
            title="Expected delivery"
            text={`${formatDay(order.expected_delivery)}${overdue ? " · Overdue" : ""}`}
            disabled={order.status === "delivered" || order.status === "cancelled"}
            onClick={() => setSheet("delivery")}
          />
        </Card>

        {/* Customer */}
        <Card className="p-4">
          <CardTitle>Customer</CardTitle>
          <p className="text-[17px] font-semibold">{order.customer.name}</p>
          <p className="text-[15px] tabular-nums text-deep/80">
            {formatPhone(order.customer.phone)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={telHref(order.customer.phone)} className={buttonClass("secondary", "h-11")}>
              <Phone size={18} /> Call
            </a>
            <a
              href={whatsappHref(
                order.customer.phone,
                `Hi ${order.customer.name.split(" ")[0]}, this is SSV about your order #${order.id}.`,
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary", "h-11")}
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
          <div className="mt-4 border-t border-sand pt-3">
            <p className="text-[13px] font-semibold text-deep/65">Delivery address</p>
            <p className="mt-1 text-[15px] leading-[1.5]">
              {order.address.name}, {formatAddress(order.address)}
            </p>
            <button
              type="button"
              onClick={async () => {
                const text = `${order.address.name}, ${formatAddress(order.address)}. Phone ${formatPhone(order.address.phone)}`;
                try {
                  await navigator.clipboard.writeText(text);
                  toast({ message: "Address copied" });
                } catch {
                  toast({
                    message: "Couldn't copy. Long-press the address to copy it.",
                    tone: "error",
                  });
                }
              }}
              className={buttonClass("ghost", "-ml-3 mt-1")}
            >
              <Copy size={18} /> Copy address
            </button>
          </div>
        </Card>

        {/* Items */}
        <Card className="p-4">
          <CardTitle>{plural(itemCount(order), "item")}</CardTitle>
          <ul className="divide-y divide-sand">
            {order.items.map((it) => (
              <li key={it.id} className="flex gap-3 py-3 first:pt-1">
                <Thumb src={it.image_url} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{it.name}</p>
                  <p className="text-[14px] text-deep/70">{it.variant_label}</p>
                  {it.weight_kg !== undefined && (
                    <p className="mt-1 text-[14px] font-semibold">{it.weight_kg} kg</p>
                  )}
                  {it.customisation && (
                    <p className="mt-1 rounded-[8px] bg-sand/50 px-2.5 py-1.5 text-[14px] leading-[1.45]">
                      {it.customisation}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] text-deep/70 tabular-nums">
                    {it.qty} × {formatINR(it.price)}
                  </p>
                  <p className="font-semibold tabular-nums">{formatINR(it.qty * it.price)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Bill: prices already include delivery, so no delivery line is shown or added. */}
        <Card className="p-4">
          <CardTitle>Bill</CardTitle>
          <dl className="space-y-1.5 text-[15px]">
            {order.items.length > 1 && (
              <div className="flex justify-between">
                <dt className="text-deep/75">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatINR(order.items.reduce((s, i) => s + i.qty * i.price, 0))}
                </dd>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <dt>Total payable</dt>
              <dd className="tabular-nums">{formatINR(order.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-deep/75">Paid so far</dt>
              <dd className="tabular-nums">{formatINR(order.amount_paid)}</dd>
            </div>
            <div className="flex justify-between border-t border-sand pt-2 text-[17px] font-bold">
              <dt>Amount due</dt>
              <dd className="tabular-nums">{formatINR(due)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[13px] text-deep/60">
            {order.payment_method === "cod" ? "Cash on delivery" : "Paid online"}. Prices include
            delivery.
          </p>
        </Card>
      </div>

      {(mainNext || (order.status === "delivered" && due > 0)) && (
        <ActionBar>
          {mainNext ? (
            <button
              type="button"
              disabled={busy}
              onClick={onPrimary}
              className={buttonClass("primary", "w-full")}
            >
              {busy ? "Updating…" : NEXT_STEP_LABEL[order.status]}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheet("payment")}
              className={buttonClass("primary", "w-full")}
            >
              Record payment · {formatINR(due)} due
            </button>
          )}
        </ActionBar>
      )}

      {sheet === "progress" && <ProgressSheet order={order} onClose={() => setSheet(null)} />}
      {sheet === "payment" && <PaymentSheet order={order} onClose={() => setSheet(null)} />}
      {sheet === "delivery" && <DeliverySheet order={order} onClose={() => setSheet(null)} />}
    </div>
  );
}

function ActionRow({
  icon,
  title,
  text,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sand/30 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          disabled ? "bg-sand/60 text-deep/45" : "bg-leaf/15 text-forest",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[16px] font-semibold", disabled && "text-deep/60")}>
          {title}
        </span>
        <span className="block truncate text-[14px] text-deep/70">{text}</span>
      </span>
      {!disabled && <ChevronRight size={20} className="shrink-0 text-deep/50" />}
    </button>
  );
}

function OrderStepper({ status }: { status: OrderStatus }) {
  const current = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return (
    <ol aria-label="Order progress" className="mt-4 grid grid-cols-5">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li
            key={step}
            aria-current={i === current ? "step" : undefined}
            className="relative flex flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 right-1/2 left-[-50%] h-0.5",
                  i <= current ? "bg-forest" : "bg-sand",
                )}
              />
            )}
            <span
              className={cn(
                "relative grid size-7 place-items-center rounded-full text-[12px] font-bold",
                done ? "bg-forest text-cream" : "border-2 border-sand bg-white text-deep/50",
                i === current && status !== "delivered" && "ring-4 ring-leaf/30",
              )}
            >
              {done ? <Check size={15} /> : i + 1}
            </span>
            <span
              className={cn(
                "mt-1.5 text-[11px] leading-tight",
                i === current ? "font-bold" : "text-deep/70",
              )}
            >
              {ORDER_STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- Sheets

function ProgressSheet({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const toast = useToast();
  const options = nextStatuses(order.status);
  const [choice, setChoice] = useState<OrderStatus>(
    options.find((s) => s !== "cancelled") ?? options[0],
  );
  const [collect, setCollect] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [saving, setSaving] = useState(false);
  const due = amountDue(order);

  const save = async (status: OrderStatus) => {
    setSaving(true);
    try {
      const collectAmount = status === "delivered" && due > 0 && collect ? due : 0;
      await updateOrderStatus(order.id, status, { collectAmount });
      toast({
        message:
          status === "cancelled"
            ? `Order #${order.id} cancelled`
            : collectAmount
              ? `Delivered and ${formatINR(collectAmount)} collected`
              : `Order #${order.id} moved to ${ORDER_STATUS_LABEL[status]}`,
      });
      onClose();
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        open={!confirmCancel}
        onClose={onClose}
        title="Update progress"
        description={`Order #${order.id} is ${ORDER_STATUS_LABEL[order.status].toLowerCase()}.`}
        footer={
          <button
            type="button"
            disabled={saving}
            onClick={() => (choice === "cancelled" ? setConfirmCancel(true) : save(choice))}
            className={buttonClass(choice === "cancelled" ? "danger" : "primary", "w-full")}
          >
            {saving
              ? "Saving…"
              : choice === "cancelled"
                ? "Cancel order…"
                : `Move to ${ORDER_STATUS_LABEL[choice]}`}
          </button>
        }
      >
        <div role="radiogroup" aria-label="Next step" className="space-y-2">
          {options.map((s) => (
            <OptionRow
              key={s}
              selected={choice === s}
              onClick={() => setChoice(s)}
              title={ORDER_STATUS_LABEL[s]}
              tone={s === "cancelled" ? "danger" : undefined}
              text={
                s === "cancelled"
                  ? "Only possible while pending"
                  : s === "delivered"
                    ? "The customer has received the order"
                    : undefined
              }
            />
          ))}
        </div>

        {choice === "delivered" && due > 0 && (
          <div className="mt-5 rounded-[12px] border border-marigold bg-marigold/10 p-4">
            <p className="text-[16px] font-semibold">Collect {formatINR(due)} now?</p>
            <p className="text-[14px] text-deep/75">
              Paid so far {formatINR(order.amount_paid)} of {formatINR(order.total)}.
            </p>
            <div role="radiogroup" aria-label="Collect payment" className="mt-3 space-y-2">
              <OptionRow
                selected={collect}
                onClick={() => setCollect(true)}
                title={`Yes, ${formatINR(due)} collected`}
                text="Marks the order fully paid"
              />
              <OptionRow
                selected={!collect}
                onClick={() => setCollect(false)}
                title="Not now"
                text={`${formatINR(due)} stays due`}
              />
            </div>
          </div>
        )}
      </Sheet>
      <ConfirmSheet
        open={confirmCancel}
        title={`Cancel order #${order.id}?`}
        message={`${order.customer.name}'s order of ${formatINR(order.total)} will be cancelled. This can't be undone.`}
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        destructive
        onConfirm={() => save("cancelled")}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}

function PaymentSheet({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const toast = useToast();
  const due = amountDue(order);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const value = Number(amount) || 0;
  const error = value > due ? `That's more than the ${formatINR(due)} due.` : undefined;
  const paidAfter = order.amount_paid + Math.min(value, due);

  const record = async (n: number) => {
    setSaving(true);
    try {
      await recordOrderPayment(order.id, n);
      toast({
        message:
          n === due
            ? `Order #${order.id} is fully paid`
            : `${formatINR(n)} recorded for #${order.id}`,
      });
      onClose();
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Record payment received"
      description={`${order.payment_method === "cod" ? "Cash on delivery" : "Online"} · Total ${formatINR(order.total)}`}
      footer={
        <div className="grid gap-2">
          <button
            type="button"
            disabled={saving || !(value > 0) || !!error}
            onClick={() => record(value)}
            className={buttonClass("primary", "w-full")}
          >
            {saving ? "Saving…" : value > 0 ? `Record ${formatINR(value)}` : "Record payment"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => record(due)}
            className={buttonClass("secondary", "w-full")}
          >
            Mark fully paid
          </button>
        </div>
      }
    >
      <TextField
        label="Amount received"
        prefix="₹"
        inputMode="numeric"
        data-autofocus
        placeholder="0"
        value={amount}
        error={error}
        hint="Advance payments and cash collected on delivery both go here."
        onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
      />
      <button
        type="button"
        onClick={() => setAmount(String(due))}
        className="mt-3 inline-flex h-11 items-center rounded-full border border-forest px-4 text-[14px] font-semibold text-forest hover:bg-leaf/10"
      >
        Full due {formatINR(due)}
      </button>
      <p
        aria-live="polite"
        className="mt-4 rounded-[10px] bg-white px-4 py-3 text-[15px] font-semibold tabular-nums"
      >
        Paid {formatINR(paidAfter)}, due {formatINR(Math.max(0, order.total - paidAfter))}
      </p>
    </Sheet>
  );
}

function DeliverySheet({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState(toDateInput(order.expected_delivery));
  const [saving, setSaving] = useState(false);
  const plus = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toDateInput(d.toISOString());
  };
  const quick = [
    { label: "Tomorrow", value: plus(1) },
    { label: "+2 days", value: plus(2) },
    { label: "+4 days", value: plus(4) },
  ];
  const past = value && value < toDateInput(new Date().toISOString());

  const save = async () => {
    setSaving(true);
    try {
      await updateExpectedDelivery(order.id, fromDateInput(value));
      toast({ message: `Expected delivery set to ${formatDay(fromDateInput(value))}` });
      onClose();
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Expected delivery"
      description="For tracking and customer updates only. It doesn't change the price."
      footer={
        <button
          type="button"
          disabled={saving || !value}
          onClick={save}
          className={buttonClass("primary", "w-full")}
        >
          {saving ? "Saving…" : "Save date"}
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            aria-pressed={value === q.value}
            onClick={() => setValue(q.value)}
            className={cn(
              "h-11 rounded-full border px-4 text-[14px] font-semibold",
              value === q.value ? "border-forest bg-forest text-cream" : "border-sand bg-white",
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
      <TextField
        label="Date"
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={past ? "This date has passed, so the order will show as overdue." : undefined}
      />
    </Sheet>
  );
}
