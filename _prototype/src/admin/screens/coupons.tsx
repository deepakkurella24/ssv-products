import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Plus, Shuffle, TicketPercent } from "lucide-react";
import {
  couponStatus,
  createCoupon,
  deleteCoupon,
  generateCouponCode,
  getCouponById,
  getCoupons,
  isCouponCodeTaken,
  toggleCoupon,
  updateCoupon,
  type Coupon,
  type CouponInput,
  type CouponStatus,
  type CouponType,
} from "@/data/admin/coupons";
import { CouponChip } from "@/admin/components/chips";
import { OverflowMenu } from "@/admin/components/menu";
import { ConfirmSheet, Sheet } from "@/admin/components/sheet";
import { SplitLayout } from "@/admin/components/SplitLayout";
import { useToast } from "@/admin/components/toast";
import {
  AppBar,
  buttonClass,
  Card,
  CardTitle,
  DetailPlaceholder,
  EmptyState,
  ErrorState,
  Fab,
  FilterChips,
  ListSkeleton,
  NumberStepper,
  SaveBar,
  Segmented,
  Skeleton,
  Switch,
  TextField,
} from "@/admin/components/ui";
import { useUnsavedChanges } from "@/admin/components/unsaved";
import { formatDay, formatINR, fromDateInput, toDateInput } from "@/admin/lib/format";
import { COUPON_STATUS_LABEL } from "@/admin/lib/status";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { useImmersive } from "@/admin/shell/ShellContext";
import { cn } from "@/lib/utils";

const FILTERS: (CouponStatus | "all")[] = ["all", "active", "scheduled", "expired", "disabled"];

/** "10% off, up to ₹100, orders above ₹499" */
export function offerSummary(c: Pick<Coupon, "type" | "value" | "max_discount" | "min_order">) {
  const main = c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`;
  const cap = c.type === "PERCENT" && c.max_discount ? `, up to ${formatINR(c.max_discount)}` : "";
  const min = c.min_order > 0 ? `, orders above ${formatINR(c.min_order)}` : ", any order";
  return `${main}${cap}${min}`;
}

function validity(c: Coupon, status: CouponStatus) {
  if (status === "scheduled") return `Starts ${formatDay(c.starts_at)}`;
  if (new Date(c.ends_at).getTime() < Date.now()) return `Ended ${formatDay(c.ends_at)}`;
  return `Ends ${formatDay(c.ends_at)}`;
}

// ---------------------------------------------------------------- Section

export function CouponsSection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const createRequest = (location.state as { create?: number } | null)?.create;

  useEffect(() => {
    if (createRequest && !id) {
      setCreating(true);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [createRequest, id, navigate, location.pathname, location.search]);
  useEffect(() => {
    if (id) setCreating(false);
  }, [id]);

  const startCreate = () => {
    if (id)
      navigate(
        { pathname: "/admin/coupons", search: location.search },
        { state: { create: Date.now() } },
      );
    else setCreating(true);
  };

  return (
    <>
      <title>Coupons · SSV Admin</title>
      <SplitLayout
        hasDetail={!!id || creating}
        list={<CouponsList selectedId={id} wide={!id && !creating} onAdd={startCreate} />}
        detail={
          creating ? <CouponForm mode="create" onDone={() => setCreating(false)} /> : <Outlet />
        }
        placeholder={
          <DetailPlaceholder
            icon={TicketPercent}
            text="Select a coupon to edit it, or create a new one."
          />
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- List

function CouponsList({
  selectedId,
  wide,
  onAdd,
}: {
  selectedId?: string;
  wide: boolean;
  onAdd: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const filter = (params.get("status") as CouponStatus | null) ?? "all";
  const search = params.toString() ? `?${params.toString()}` : "";
  const { data, error, loading, retry } = useApi(getCoupons, []);
  const toast = useToast();
  const now = Date.now();

  const withStatus = useMemo(
    () => (data ?? []).map((c) => ({ coupon: c, status: couponStatus(c, now) })),
    [data, now],
  );
  const counts: Record<string, number> = { all: withStatus.length };
  for (const x of withStatus) counts[x.status] = (counts[x.status] ?? 0) + 1;
  const list = withStatus.filter((x) => filter === "all" || x.status === filter);

  const toggle = async (c: Coupon, active: boolean) => {
    try {
      await toggleCoupon(c.id, active);
      toast({
        message: `${c.code} ${active ? "turned on" : "turned off"}`,
        action: {
          label: "Undo",
          onClick: () => toggleCoupon(c.id, !active).catch(() => undefined),
        },
      });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    }
  };

  return (
    <>
      <AppBar
        title="Coupons"
        backTo="/admin/more"
        backLabel="Back to More"
        actions={
          <button
            type="button"
            onClick={onAdd}
            className={buttonClass("primary", "mr-1 h-11 px-4 text-[15px] max-md:hidden")}
          >
            <Plus size={18} /> New coupon
          </button>
        }
      >
        <FilterChips
          label="Filter coupons"
          value={filter}
          onChange={(v) => setParams(v === "all" ? {} : { status: v }, { replace: true })}
          options={FILTERS.map((s) => ({
            value: s,
            label: s === "all" ? "All" : COUPON_STATUS_LABEL[s],
            count: data ? (counts[s] ?? 0) : undefined,
          }))}
        />
      </AppBar>

      <div className="p-4 pb-24 md:pb-4">
        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title={
              filter === "all"
                ? "No coupons yet"
                : `No ${COUPON_STATUS_LABEL[filter as CouponStatus].toLowerCase()} coupons`
            }
            text="Coupons let you offer a discount for a limited time."
            action={
              <button type="button" onClick={onAdd} className={buttonClass("primary")}>
                <Plus size={18} /> New coupon
              </button>
            }
          />
        ) : (
          <ul className={cn("grid gap-3", wide && "lg:grid-cols-2 xl:grid-cols-3")}>
            {list.map(({ coupon: c, status }) => {
              const usedPct = c.usage_limit
                ? Math.min(100, (c.used_count / c.usage_limit) * 100)
                : 0;
              return (
                <li key={c.id}>
                  <div
                    className={cn(
                      "relative rounded-card border bg-white p-4 transition-colors hover:border-deep/30",
                      c.id === selectedId ? "border-forest ring-1 ring-forest" : "border-sand",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/admin/coupons/${c.id}${search}`}
                            className="rounded-[6px] bg-sand px-2 py-0.5 font-mono text-[15px] font-bold tracking-wide after:absolute after:inset-0 after:rounded-card"
                          >
                            {c.code}
                          </Link>
                          <CouponChip status={status} />
                        </div>
                        <p className="mt-2 text-[15px]">{offerSummary(c)}</p>
                      </div>
                      <Switch
                        className="relative z-10 -mt-1 -mr-1"
                        label={`${c.code} active`}
                        checked={c.active}
                        onChange={(v) => toggle(c, v)}
                      />
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[13px] text-deep/70">
                        <span className="tabular-nums">
                          {c.usage_limit
                            ? `${c.used_count} of ${c.usage_limit} used`
                            : `${c.used_count} used · no limit`}
                        </span>
                        <span>{validity(c, status)}</span>
                      </div>
                      {c.usage_limit && (
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-full bg-forest"
                            style={{ width: `${Math.max(usedPct, c.used_count ? 2 : 0)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Fab label="New coupon" onClick={onAdd} icon={<Plus size={26} />} />
    </>
  );
}

// ---------------------------------------------------------------- Form

export function CouponEditRoute() {
  const { id } = useParams();
  const location = useLocation();
  const { data, error, loading, retry } = useApi(() => getCouponById(id!), [id]);
  const [initial, setInitial] = useState<Coupon | null | undefined>(undefined);
  useEffect(() => {
    if (data !== undefined && initial === undefined) setInitial(data);
  }, [data, initial]);
  useImmersive();
  const back = `/admin/coupons${location.search}`;

  if (initial === undefined) {
    return (
      <>
        <AppBar title="Edit coupon" backTo={back} />
        {error && !loading ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : (
          <div className="space-y-3 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}
      </>
    );
  }
  if (initial === null) {
    return (
      <>
        <AppBar title="Coupon not found" backTo={back} />
        <EmptyState
          icon={TicketPercent}
          title="We couldn't find this coupon"
          text="It may have been deleted."
          action={
            <Link to="/admin/coupons" className={buttonClass("secondary")}>
              All coupons
            </Link>
          }
        />
      </>
    );
  }
  return <CouponForm key={initial.id} mode="edit" coupon={initial} />;
}

interface CouponDraft {
  code: string;
  type: CouponType;
  value: string;
  max_discount: string;
  min_order: string;
  usage_limit: string;
  per_user_limit: number;
  starts: string;
  ends: string;
  active: boolean;
}

function toDraft(c?: Coupon): CouponDraft {
  const today = new Date();
  const in30 = new Date(Date.now() + 30 * 86_400_000);
  return {
    code: c?.code ?? "",
    type: c?.type ?? "PERCENT",
    value: c ? String(c.value) : "",
    max_discount: c?.max_discount ? String(c.max_discount) : "",
    min_order: c ? String(c.min_order) : "",
    usage_limit: c?.usage_limit ? String(c.usage_limit) : "",
    per_user_limit: c?.per_user_limit ?? 1,
    starts: toDateInput((c ? new Date(c.starts_at) : today).toISOString()),
    ends: toDateInput((c ? new Date(c.ends_at) : in30).toISOString()),
    active: c?.active ?? true,
  };
}

function CouponForm({
  mode,
  coupon,
  onDone,
}: {
  mode: "create" | "edit";
  coupon?: Coupon;
  onDone?: () => void;
}) {
  useImmersive();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const initial = useMemo(() => toDraft(coupon), [coupon]);
  const [d, setD] = useState<CouponDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const guard = useUnsavedChanges(dirty);
  const set = <K extends keyof CouponDraft>(k: K, v: CouponDraft[K]) =>
    setD((s) => ({ ...s, [k]: v }));
  const listUrl = `/admin/coupons${location.search}`;

  const value = Number(d.value) || 0;
  const maxDiscount = Number(d.max_discount) || 0;
  const minOrder = Number(d.min_order) || 0;

  const errors: Record<string, string> = {};
  const codeTaken = d.code.length >= 3 && isCouponCodeTaken(d.code, coupon?.id);
  if (!/^[A-Z0-9]{3,16}$/.test(d.code)) errors.code = "Use 3 to 16 letters or numbers, no spaces.";
  else if (codeTaken) errors.code = "This code is already used by another coupon.";
  if (!(value > 0))
    errors.value =
      d.type === "PERCENT" ? "Enter a percentage above 0." : "Enter an amount above ₹0.";
  else if (d.type === "PERCENT" && value > 90)
    errors.value = "Keep percentage discounts at 90% or less.";
  else if (d.type === "FLAT" && minOrder > 0 && value >= minOrder)
    errors.value = "The discount must be less than the minimum order.";
  if (!d.starts) errors.starts = "Choose a start date.";
  if (!d.ends) errors.ends = "Choose an end date.";
  else if (d.starts && d.ends < d.starts)
    errors.ends = "The end date must be on or after the start date.";
  if (d.usage_limit && coupon && Number(d.usage_limit) < coupon.used_count) {
    errors.usage_limit = `Already used ${coupon.used_count} times. The limit can't be lower.`;
  }
  // Uniqueness shows as you type; everything else after the first save attempt.
  const err = (k: string) =>
    k === "code" && codeTaken ? errors.code : submitted ? errors[k] : undefined;

  const preview = d.code
    ? `${d.code} gives ${d.type === "PERCENT" ? `${value || 0}% off` : `${formatINR(value)} off`}${
        d.type === "PERCENT" && maxDiscount ? `, up to ${formatINR(maxDiscount)}` : ""
      }${minOrder ? ` on orders above ${formatINR(minOrder)}` : ""}`
    : "Add a code to see the preview";

  const close = () => (mode === "create" ? onDone?.() : navigate(listUrl));
  const cancel = () => (dirty ? setDiscardOpen(true) : close());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    const input: CouponInput = {
      code: d.code,
      type: d.type,
      value,
      max_discount: d.type === "PERCENT" && maxDiscount ? maxDiscount : null,
      min_order: minOrder,
      usage_limit: d.usage_limit ? Number(d.usage_limit) : null,
      per_user_limit: d.per_user_limit,
      starts_at: fromDateInput(d.starts, 0, 0),
      ends_at: fromDateInput(d.ends, 23, 59),
      active: d.active,
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createCoupon(input);
        guard.allowLeave();
        toast({
          message: `${created.code} created`,
          action: { label: "View", onClick: () => navigate(`/admin/coupons/${created.id}`) },
        });
        onDone?.();
      } else {
        await updateCoupon(coupon!.id, input);
        guard.allowLeave();
        toast({ message: `${input.code} saved` });
        navigate(listUrl);
      }
    } catch (e2) {
      toast({ message: errorMessage(e2), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const used = (coupon?.used_count ?? 0) > 0;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="flex min-h-svh flex-col md:min-h-full"
    >
      <AppBar
        title={mode === "create" ? "New coupon" : "Edit coupon"}
        onBack={cancel}
        backLabel="Close form"
        backAlways
        actions={
          mode === "edit" ? (
            <OverflowMenu
              items={[{ label: "Delete coupon", danger: true, onClick: () => setDeleteOpen(true) }]}
            />
          ) : undefined
        }
      />

      <div className="flex-1 space-y-3 p-4">
        <div aria-live="polite" className="rounded-card border border-forest/30 bg-leaf/10 p-4">
          <p className="text-[13px] font-semibold text-forest">Customers will see</p>
          <p className="mt-0.5 text-[16px] font-semibold">{preview}</p>
        </div>

        <Card className="space-y-4 p-4">
          <CardTitle>Code</CardTitle>
          <TextField
            label="Coupon code"
            value={d.code}
            error={err("code")}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="[&_input]:font-mono [&_input]:tracking-wide"
            placeholder="e.g. SSV10"
            onChange={(e) =>
              set(
                "code",
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 16),
              )
            }
            suffix={
              <button
                type="button"
                onClick={() => set("code", generateCouponCode())}
                className="inline-flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[14px] font-semibold text-forest hover:bg-sand/60"
              >
                <Shuffle size={16} /> Generate
              </button>
            }
          />
          {mode === "edit" && used && (
            <p className="text-[13px] text-deep/65">Used {coupon!.used_count} times so far.</p>
          )}
        </Card>

        <Card className="space-y-4 p-4">
          <CardTitle>Discount</CardTitle>
          <Segmented
            label="Discount type"
            value={d.type}
            onChange={(v) => set("type", v)}
            options={[
              { value: "PERCENT", label: "Percentage" },
              { value: "FLAT", label: "Flat amount" },
            ]}
          />
          <TextField
            label={d.type === "PERCENT" ? "Discount (%)" : "Discount amount"}
            prefix={d.type === "FLAT" ? "₹" : undefined}
            suffix={
              d.type === "PERCENT" ? (
                <span className="pr-2 text-[15px] text-deep/60">%</span>
              ) : undefined
            }
            inputMode="numeric"
            value={d.value}
            error={err("value")}
            onChange={(e) => set("value", e.target.value.replace(/\D/g, "").slice(0, 5))}
          />
          {d.type === "PERCENT" && (
            <TextField
              label="Maximum discount"
              optional
              prefix="₹"
              inputMode="numeric"
              value={d.max_discount}
              hint="Caps the discount on large orders."
              onChange={(e) => set("max_discount", e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          )}
          <TextField
            label="Minimum order amount"
            prefix="₹"
            inputMode="numeric"
            value={d.min_order}
            placeholder="0"
            hint="Leave empty or 0 for any order."
            onChange={(e) => set("min_order", e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </Card>

        <Card className="space-y-4 p-4">
          <CardTitle>Limits</CardTitle>
          <TextField
            label="Total usage limit"
            optional
            inputMode="numeric"
            value={d.usage_limit}
            error={err("usage_limit")}
            placeholder="Unlimited"
            hint="Leave empty for unlimited uses."
            onChange={(e) => set("usage_limit", e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold">Uses per customer</p>
            <NumberStepper
              label="uses per customer"
              value={d.per_user_limit}
              min={1}
              max={20}
              onChange={(v) => set("per_user_limit", v)}
            />
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <CardTitle>Validity</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Start date"
              type="date"
              value={d.starts}
              error={err("starts")}
              onChange={(e) => set("starts", e.target.value)}
            />
            <TextField
              label="End date"
              type="date"
              value={d.ends}
              error={err("ends")}
              onChange={(e) => set("ends", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-sand pt-3">
            <div>
              <p className="text-[15px] font-semibold">Active</p>
              <p className="text-[13px] text-deep/65">Turn off to pause the coupon any time</p>
            </div>
            <Switch label="Active" checked={d.active} onChange={(v) => set("active", v)} />
          </div>
        </Card>
      </div>

      <SaveBar
        onCancel={cancel}
        saving={saving}
        saveLabel={mode === "create" ? "Create coupon" : "Save changes"}
      />

      {guard.sheet}
      <ConfirmSheet
        open={discardOpen}
        title="Discard unsaved changes?"
        message="Your changes to this coupon will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          guard.allowLeave();
          setDiscardOpen(false);
          close();
        }}
        onClose={() => setDiscardOpen(false)}
      />
      {coupon && used ? (
        <Sheet
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={`Can't delete ${coupon.code}`}
        >
          <p className="text-[15px]">
            Customers have used this coupon {coupon.used_count} times. Disable it instead so it
            stops working and past orders keep their record.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              disabled={!coupon.active && !d.active}
              onClick={async () => {
                try {
                  await toggleCoupon(coupon.id, false);
                  set("active", false);
                  setDeleteOpen(false);
                  toast({ message: `${coupon.code} disabled` });
                } catch (e) {
                  toast({ message: errorMessage(e), tone: "error" });
                }
              }}
              className={buttonClass("primary", "w-full")}
            >
              {!coupon.active && !d.active ? "Already disabled" : "Disable instead"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className={buttonClass("secondary", "w-full")}
            >
              Keep coupon
            </button>
          </div>
        </Sheet>
      ) : (
        <ConfirmSheet
          open={deleteOpen}
          title={`Delete ${coupon?.code}?`}
          message="It hasn't been used yet, so it can be removed. This can't be undone."
          confirmLabel="Delete coupon"
          destructive
          onConfirm={async () => {
            try {
              await deleteCoupon(coupon!.id);
              guard.allowLeave();
              setDeleteOpen(false);
              toast({ message: `${coupon!.code} deleted` });
              navigate(listUrl);
            } catch (e) {
              setDeleteOpen(false);
              toast({ message: errorMessage(e), tone: "error" });
            }
          }}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </form>
  );
}
