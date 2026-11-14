"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from "@/components/admin/router-compat";
import { Plus, Shuffle, TicketPercent, X } from "lucide-react";
import {
  couponStatus,
  generateCouponCode,
  isCouponCodeTaken,
} from "@/lib/admin/helpers";
import {
  adminListCoupons as getCoupons,
  adminGetCoupon as getCouponById,
  adminCreateCoupon as createCoupon,
  adminUpdateCoupon as updateCoupon,
  adminToggleCoupon as toggleCoupon,
  adminDeleteCoupon as deleteCoupon,
} from "@/lib/api/admin";
import { CouponChip } from "@/components/admin/chips";
import { OverflowMenu } from "@/components/admin/menu";
import { ConfirmSheet, FormModal, Sheet } from "@/components/admin/sheet";
import { useToast } from "@/components/admin/toast";
import {
  AppBar,
  buttonClass,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Fab,
  FilterChips,
  IconButton,
  ListSkeleton,
  NumberStepper,
  SaveBar,
  Segmented,
  Skeleton,
  Switch,
  TextField
} from "@/components/admin/ui";
import { useUnsavedChanges } from "@/components/admin/unsaved";
import { formatDay, formatINR, fromDateInput, toDateInput } from "@/lib/admin/format";
import { COUPON_STATUS_LABEL } from "@/lib/admin/status";
import { errorMessage, useApi } from "@/lib/admin/useApi";
import { useImmersive } from "@/components/admin/shell/ShellContext";
const FILTERS = ["all", "active", "scheduled", "expired", "disabled"];
export function offerSummary(c) {
  const main = c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`;
  const cap = c.type === "PERCENT" && c.max_discount ? `, up to ${formatINR(c.max_discount)}` : "";
  const min = c.min_order > 0 ? `, orders above ${formatINR(c.min_order)}` : ", any order";
  return `${main}${cap}${min}`;
}
function validity(c, status) {
  if (status === "scheduled") return `Starts ${formatDay(c.starts_at)}`;
  if (new Date(c.ends_at).getTime() < Date.now()) return `Ended ${formatDay(c.ends_at)}`;
  return `Ends ${formatDay(c.ends_at)}`;
}
export function CouponsSection() {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelFormRef = useRef(null);
  const startCreate = () => {
    cancelFormRef.current = null;
    setEditingId(null);
    setCreating(true);
  };
  const startEdit = (coupon) => {
    cancelFormRef.current = null;
    setCreating(false);
    setEditingId(coupon.id);
  };
  const closeForm = () => {
    cancelFormRef.current = null;
    setCreating(false);
    setEditingId(null);
    setRefreshKey((key) => key + 1);
  };
  return <>
      <title>Coupons · SSV Admin</title>
      <CouponsList key={refreshKey} onAdd={startCreate} onEdit={startEdit} />
      <FormModal
        open={creating || !!editingId}
        onClose={() => {
          if (cancelFormRef.current) cancelFormRef.current();
          else {
            setCreating(false);
            setEditingId(null);
          }
        }}
      >
        {creating && (
          <CouponForm
            mode="create"
            onDone={() => {
              closeForm();
            }}
            onCancelRef={cancelFormRef}
          />
        )}
        {editingId && <CouponEditForm key={editingId} id={editingId} onDone={closeForm} onCancelRef={cancelFormRef} />}
      </FormModal>
      <Outlet />
    </>;
}
function CouponsList({ onAdd, onEdit }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("status") ?? "all";
  const { data, error, loading, retry, mutate } = useApi(getCoupons, []);
  const toast = useToast();
  const now = Date.now();
  const withStatus = useMemo(
    () => (data ?? []).map((c) => ({ coupon: c, status: couponStatus(c, now) })),
    [data, now]
  );
  const counts = { all: withStatus.length };
  for (const x of withStatus) counts[x.status] = (counts[x.status] ?? 0) + 1;
  const list = withStatus.filter((x) => filter === "all" || x.status === filter);
  const saveActive = async (coupon, active) => {
    const updated = await toggleCoupon(coupon.id, active);
    mutate((current) => current?.map((item) => item.id === coupon.id
      ? { ...item, ...updated, active: updated?.active ?? active }
      : item
    ));
  };
  const toggle = async (c, active) => {
    try {
      await saveActive(c, active);
      toast({
        message: `${c.code} ${active ? "turned on" : "turned off"}`,
        action: {
          label: "Undo",
          onClick: () => saveActive(c, !active).catch((e) => toast({ message: errorMessage(e), tone: "error" }))
        }
      });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    }
  };
  return <>
      <AppBar
    title="Coupons"
    backTo="/admin/more"
    backLabel="Back to More"
    actions={<button
      type="button"
      onClick={onAdd}
      className={buttonClass("primary", "mr-1 h-11 px-4 text-[15px] max-md:hidden")}
    >
            <Plus size={18} /> New coupon
          </button>}
  >
        <FilterChips
    label="Filter coupons"
    value={filter}
    onChange={(v) => setParams(v === "all" ? {} : { status: v }, { replace: true })}
    options={FILTERS.map((s) => ({
      value: s,
      label: s === "all" ? "All" : COUPON_STATUS_LABEL[s],
      count: data ? counts[s] ?? 0 : void 0
    }))}
  />
      </AppBar>

      <div className="p-4 pb-24 md:pb-4">
        {loading && !data ? <ListSkeleton rows={4} /> : error && !data ? <ErrorState message={errorMessage(error)} onRetry={retry} /> : list.length === 0 ? <EmptyState
    icon={TicketPercent}
    title={filter === "all" ? "No coupons yet" : `No ${COUPON_STATUS_LABEL[filter].toLowerCase()} coupons`}
    text="Coupons let you offer a discount for a limited time."
    action={<button type="button" onClick={onAdd} className={buttonClass("primary")}>
                <Plus size={18} /> New coupon
              </button>}
  /> : <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {list.map(({ coupon: c, status }) => {
    const usedPct = c.usage_limit ? Math.min(100, c.used_count / c.usage_limit * 100) : 0;
    return <li key={c.id}>
                  <div
      className="relative rounded-card border border-sand bg-white p-4 transition-colors hover:border-deep/30"
    >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
      type="button"
      onClick={() => onEdit(c)}
      className="rounded-[6px] bg-sand px-2 py-0.5 font-mono text-[15px] font-bold tracking-wide after:absolute after:inset-0 after:rounded-card"
    >
                            {c.code}
                          </button>
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
                          {c.usage_limit ? `${c.used_count} of ${c.usage_limit} used` : `${c.used_count} used \xB7 no limit`}
                        </span>
                        <span>{validity(c, status)}</span>
                      </div>
                      {c.usage_limit && <div
      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand"
      aria-hidden
    >
                          <div
      className="h-full rounded-full bg-forest"
      style={{ width: `${Math.max(usedPct, c.used_count ? 2 : 0)}%` }}
    />
                        </div>}
                    </div>
                  </div>
                </li>;
  })}
          </ul>}
      </div>
      <Fab label="New coupon" onClick={onAdd} icon={<Plus size={26} />} />
    </>;
}
function CouponEditForm({ id, onDone, onCancelRef }) {
  const { data, error, loading, retry } = useApi(() => getCouponById(id), [id]);
  if (loading && data === undefined) return <><AppBar title="Edit coupon" onBack={onDone} backLabel="Close form" backAlways /><div className="space-y-3 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div></>;
  if (error) return <><AppBar title="Edit coupon" onBack={onDone} backLabel="Close form" backAlways /><div className="p-4"><ErrorState message={errorMessage(error)} onRetry={retry} /></div></>;
  if (data === null) return <><AppBar title="Edit coupon" onBack={onDone} backLabel="Close form" backAlways /><EmptyState icon={TicketPercent} title="We couldn't find this coupon" text="It may have been deleted." /></>;
  if (!data) return null;
  return <CouponForm key={data.id} mode="edit" coupon={data} onDone={onDone} onCancelRef={onCancelRef} />;
}
export function CouponEditRoute() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  const close = () => navigate(`/admin/coupons${location.search}`);
  return <FormModal open onClose={() => (cancelRef.current ? cancelRef.current() : close())}>
    <CouponEditForm id={id} onDone={close} onCancelRef={cancelRef} />
  </FormModal>;
}
function toDraft(c) {
  const today = /* @__PURE__ */ new Date();
  const in30 = new Date(Date.now() + 30 * 864e5);
  return {
    code: c?.code ?? "",
    type: c?.type === "FLAT" ? "FIXED" : (c?.type ?? "PERCENT"),
    value: c ? String(c.value) : "",
    max_discount: c?.max_discount ? String(c.max_discount) : "",
    min_order: c ? String(c.min_order) : "",
    usage_limit: c?.usage_limit ? String(c.usage_limit) : "",
    per_user_limit: c?.per_user_limit ?? 1,
    starts: toDateInput((c ? new Date(c.starts_at) : today).toISOString()),
    ends: toDateInput((c ? new Date(c.ends_at) : in30).toISOString()),
    active: c?.active ?? true
  };
}
function CouponForm({
  mode,
  coupon,
  onDone,
  onCancelRef
}) {
  useImmersive();
  const toast = useToast();
  const initial = useMemo(() => toDraft(coupon), [coupon]);
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const formRef = useRef(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const guard = useUnsavedChanges(dirty);
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const value = Number(d.value) || 0;
  const maxDiscount = Number(d.max_discount) || 0;
  const minOrder = Number(d.min_order) || 0;
  const errors = {};
  const codeTaken = d.code.length >= 3 && isCouponCodeTaken(d.code, coupon?.id);
  if (!/^[A-Z0-9]{3,16}$/.test(d.code)) errors.code = "Use 3 to 16 letters or numbers, no spaces.";
  else if (codeTaken) errors.code = "This code is already used by another coupon.";
  if (!(value > 0))
    errors.value = d.type === "PERCENT" ? "Enter a percentage above 0." : "Enter an amount above \u20B90.";
  else if (d.type === "PERCENT" && value > 90)
    errors.value = "Keep percentage discounts at 90% or less.";
  else if ((d.type === "FIXED" || d.type === "FLAT") && minOrder > 0 && value >= minOrder)
    errors.value = "The discount must be less than the minimum order.";
  if (!d.starts) errors.starts = "Choose a start date.";
  if (!d.ends) errors.ends = "Choose an end date.";
  else if (d.starts && d.ends < d.starts)
    errors.ends = "The end date must be on or after the start date.";
  if (d.usage_limit && coupon && Number(d.usage_limit) < coupon.used_count) {
    errors.usage_limit = `Already used ${coupon.used_count} times. The limit can't be lower.`;
  }
  const err = (k) => k === "code" && codeTaken ? errors.code : submitted ? errors[k] : void 0;
  const preview = d.code ? `${d.code} gives ${d.type === "PERCENT" ? `${value || 0}% off` : `${formatINR(value)} off`}${d.type === "PERCENT" && maxDiscount ? `, up to ${formatINR(maxDiscount)}` : ""}${minOrder ? ` on orders above ${formatINR(minOrder)}` : ""}` : "Add a code to see the preview";
  const close = () => onDone?.();
  const cancel = () => dirty ? setDiscardOpen(true) : close();

  useEffect(() => {
    if (onCancelRef) onCancelRef.current = cancel;
  });
  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(
        () => formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    const input = {
      code: d.code,
      type: d.type === "FLAT" ? "FIXED" : d.type,
      value,
      max_discount: d.type === "PERCENT" && maxDiscount ? maxDiscount : null,
      min_order: minOrder,
      usage_limit: d.usage_limit ? Number(d.usage_limit) : null,
      per_user_limit: d.per_user_limit,
      starts_at: fromDateInput(d.starts, 0, 0),
      ends_at: fromDateInput(d.ends, 23, 59),
      active: d.active
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createCoupon(input);
        guard.allowLeave();
        toast({ message: `${created.code} created` });
        onDone?.();
      } else {
        await updateCoupon(coupon.id, input);
        guard.allowLeave();
        toast({ message: `${input.code} saved` });
        onDone?.();
      }
    } catch (e2) {
      toast({ message: errorMessage(e2), tone: "error" });
    } finally {
      setSaving(false);
    }
  };
  const used = (coupon?.used_count ?? 0) > 0;
  return <form
    ref={formRef}
    onSubmit={submit}
    noValidate
    className="flex min-h-0 flex-1 flex-col overflow-y-auto"
  >
      <AppBar
    title={mode === "create" ? "New coupon" : "Edit coupon"}
    onBack={mode === "create" ? undefined : cancel}
    backLabel="Close form"
    backAlways={mode !== "create"}
    actions={mode === "edit" ? <OverflowMenu
      items={[{ label: "Delete coupon", danger: true, onClick: () => setDeleteOpen(true) }]}
    /> : <IconButton label="Close" onClick={cancel}><X size={22} /></IconButton>}
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
    onChange={(e) => set(
      "code",
      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16)
    )}
    suffix={<button
      type="button"
      onClick={() => set("code", generateCouponCode())}
      className="inline-flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[14px] font-semibold text-forest hover:bg-sand/60"
    >
                <Shuffle size={16} /> Generate
              </button>}
  />
          {mode === "edit" && used && <p className="text-[13px] text-deep/65">Used {coupon.used_count} times so far.</p>}
        </Card>

        <Card className="space-y-4 p-4">
          <CardTitle>Discount</CardTitle>
          <Segmented
    label="Discount type"
    value={d.type}
    onChange={(v) => set("type", v)}
    options={[
      { value: "PERCENT", label: "Percentage" },
      { value: "FIXED", label: "Flat amount" }
    ]}
  />
          <TextField
    label={d.type === "PERCENT" ? "Discount (%)" : "Discount amount"}
    prefix={d.type === "FIXED" || d.type === "FLAT" ? "\u20B9" : void 0}
    suffix={d.type === "PERCENT" ? <span className="pr-2 text-[15px] text-deep/60">%</span> : void 0}
    inputMode="numeric"
    value={d.value}
    error={err("value")}
    onChange={(e) => set("value", e.target.value.replace(/\D/g, "").slice(0, 5))}
  />
          {d.type === "PERCENT" && <TextField
    label="Maximum discount"
    optional
    prefix="₹"
    inputMode="numeric"
    value={d.max_discount}
    hint="Caps the discount on large orders."
    onChange={(e) => set("max_discount", e.target.value.replace(/\D/g, "").slice(0, 6))}
  />}
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
      {coupon && used ? <Sheet
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
        const updated = await toggleCoupon(coupon.id, false);
        set("active", updated?.active ?? false);
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
        </Sheet> : <ConfirmSheet
    open={deleteOpen}
    title={`Delete ${coupon?.code}?`}
    message="It hasn't been used yet, so it can be removed. This can't be undone."
    confirmLabel="Delete coupon"
    destructive
    onConfirm={async () => {
      try {
        await deleteCoupon(coupon.id);
        guard.allowLeave();
        setDeleteOpen(false);
        toast({ message: `${coupon.code} deleted` });
        onDone?.();
      } catch (e) {
        setDeleteOpen(false);
        toast({ message: errorMessage(e), tone: "error" });
      }
    }}
    onClose={() => setDeleteOpen(false)}
  />}
    </form>;
}
