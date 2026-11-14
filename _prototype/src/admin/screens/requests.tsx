import { useMemo, useState, type FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Check,
  CircleCheck,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  Plus,
} from "lucide-react";
import { INDIAN_STATES } from "@/data/states";
import {
  addCustomerAddress,
  createOrderFromRequest,
  getCustomRequestById,
  getCustomRequests,
  nextRequestStatuses,
  REQUEST_STEPS,
  saveAdminNotes,
  updateCustomRequestStatus,
} from "@/data/admin/requests";
import type {
  AdminAddress,
  AdminCustomRequest,
  AdminOrder,
  RequestStatus,
} from "@/data/admin/types";
import { RequestChip } from "@/admin/components/chips";
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
  ListSkeleton,
  SelectField,
  Skeleton,
  TextAreaField,
  TextField,
  usePaged,
} from "@/admin/components/ui";
import {
  formatAddress,
  formatDateTime,
  formatINR,
  formatPhone,
  telHref,
  timeAgo,
  whatsappHref,
} from "@/admin/lib/format";
import { REQUEST_STATUS_LABEL } from "@/admin/lib/status";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { useImmersive } from "@/admin/shell/ShellContext";
import { cn } from "@/lib/utils";

const FILTERS: (RequestStatus | "all")[] = ["all", "new", "contacted", "confirmed", "closed"];

const NEXT_LABEL: Record<RequestStatus, string> = {
  new: "Mark new",
  contacted: "Mark contacted",
  confirmed: "Mark confirmed",
  closed: "Close request",
};

// ---------------------------------------------------------------- Section

export function RequestsSection() {
  const { id } = useParams();
  return (
    <>
      <title>Custom requests · SSV Admin</title>
      <SplitLayout
        hasDetail={!!id}
        list={<RequestsList selectedId={id} wide={!id} />}
        detail={<Outlet />}
        placeholder={
          <DetailPlaceholder
            icon={MessageSquareText}
            text="Select a request to call the customer and update it."
          />
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- List

function RequestsList({ selectedId, wide }: { selectedId?: string; wide: boolean }) {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as RequestStatus | null) ?? "all";
  const search = params.toString() ? `?${params.toString()}` : "";
  const { data, error, loading, retry } = useApi(getCustomRequests, []);
  const now = Date.now();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    for (const r of data ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [data]);
  const list = (data ?? []).filter((r) => status === "all" || r.status === status);

  return (
    <>
      <AppBar title="Custom requests">
        <FilterChips
          label="Filter by status"
          value={status}
          onChange={(v) => setParams(v === "all" ? {} : { status: v }, { replace: true })}
          options={FILTERS.map((s) => ({
            value: s,
            label: s === "all" ? "All" : REQUEST_STATUS_LABEL[s],
            count: data ? (counts[s] ?? 0) : undefined,
          }))}
        />
      </AppBar>
      <div className="p-4">
        {loading && !data ? (
          <ListSkeleton />
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title={status === "new" ? "No new requests" : "No requests here"}
            text={
              status === "new"
                ? "When a customer asks for a custom quantity, it will show up here."
                : "Try another filter."
            }
          />
        ) : (
          <RequestResults
            key={status}
            requests={list}
            wide={wide}
            selectedId={selectedId}
            search={search}
            now={now}
          />
        )}
      </div>
    </>
  );
}

function RequestResults({
  requests,
  wide,
  selectedId,
  search,
  now,
}: {
  requests: AdminCustomRequest[];
  wide: boolean;
  selectedId?: string;
  search: string;
  now: number;
}) {
  const paged = usePaged(requests, 30);
  const navigate = useNavigate();
  return (
    <>
      <ul className={cn("space-y-3", wide && "lg:hidden")}>
        {paged.visible.map((r) => {
          const to = `/admin/requests/${r.id}${search}`;
          return (
            <li key={r.id}>
              <div
                className={cn(
                  "relative rounded-card border bg-white p-4 transition-colors hover:border-deep/30",
                  r.id === selectedId ? "border-forest ring-1 ring-forest" : "border-sand",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-deep/65">
                      {r.status === "new" && (
                        <span aria-label="New" className="size-2.5 rounded-full bg-leaf" />
                      )}
                      {r.id} · {timeAgo(r.received_at, now)}
                    </p>
                    <Link
                      to={to}
                      className="mt-0.5 block text-[16px] font-semibold after:absolute after:inset-0 after:rounded-card"
                    >
                      {r.product_name}{" "}
                      <span className="font-normal text-deep/70">· {r.quantity_kg} kg</span>
                    </Link>
                    <p className="mt-1 line-clamp-2 text-[14px] leading-[1.45] text-deep/80">
                      {r.customisation}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <RequestChip status={r.status} />
                      <span className="text-[13px] tabular-nums text-deep/70">
                        {formatPhone(r.customer.phone)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={telHref(r.customer.phone)}
                    aria-label={`Call ${formatPhone(r.customer.phone)}`}
                    className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-forest text-forest hover:bg-leaf/10"
                  >
                    <Phone size={20} />
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {wide && (
        <Card className="hidden overflow-hidden lg:block">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-sand bg-sand/40 text-[12px] tracking-[0.04em] text-deep/70 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Request</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Details</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {paged.visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/requests/${r.id}${search}`)}
                  className="cursor-pointer hover:bg-sand/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/requests/${r.id}${search}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 font-semibold hover:underline"
                    >
                      {r.status === "new" && (
                        <span aria-label="New" className="size-2.5 rounded-full bg-leaf" />
                      )}
                      {r.id}
                    </Link>
                    <span className="block text-[12px] text-deep/60">
                      {timeAgo(r.received_at, now)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.product_name}
                    <span className="block text-[12px] text-deep/60 tabular-nums">
                      {r.quantity_kg} kg
                    </span>
                  </td>
                  <td className="max-w-[320px] px-4 py-3">
                    <span className="line-clamp-2">{r.customisation}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatPhone(r.customer.phone)}
                  </td>
                  <td className="px-4 py-3">
                    <RequestChip status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={telHref(r.customer.phone)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Call ${formatPhone(r.customer.phone)}`}
                      className="inline-grid size-11 place-items-center rounded-full border border-forest text-forest hover:bg-leaf/10"
                    >
                      <Phone size={18} />
                    </a>
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

// ---------------------------------------------------------------- Detail

export function RequestDetailRoute() {
  const { id } = useParams();
  return <RequestDetail key={id} id={id!} />;
}

function RequestDetail({ id }: { id: string }) {
  useImmersive();
  const location = useLocation();
  const backTo = `/admin/requests${location.search}`;
  const toast = useToast();
  const { data: req, loading, error, retry } = useApi(() => getCustomRequestById(id), [id]);
  const [notes, setNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  if (loading && req === undefined) {
    return (
      <>
        <AppBar title={id} backTo={backTo} backLabel="Back to requests" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </>
    );
  }
  if (error && req === undefined) {
    return (
      <>
        <AppBar title={id} backTo={backTo} backLabel="Back to requests" />
        <ErrorState message={errorMessage(error)} onRetry={retry} />
      </>
    );
  }
  if (!req) {
    return (
      <>
        <AppBar title="Request not found" backTo={backTo} backLabel="Back to requests" />
        <EmptyState
          icon={MessageSquareText}
          title={`We couldn't find ${id}`}
          action={
            <Link to="/admin/requests" className={buttonClass("secondary")}>
              All requests
            </Link>
          }
        />
      </>
    );
  }

  const draftNotes = notes ?? req.admin_notes;
  const notesDirty = draftNotes !== req.admin_notes;
  const nexts = nextRequestStatuses(req.status);
  const canCreateOrder = req.status !== "closed" && !req.order_id;

  const move = async (next: RequestStatus) => {
    setBusyStatus(true);
    try {
      await updateCustomRequestStatus(req.id, next);
      toast({ message: `${req.id} marked ${REQUEST_STATUS_LABEL[next].toLowerCase()}` });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setBusyStatus(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col md:min-h-full">
      <title>{`${req.id} · SSV Admin`}</title>
      <AppBar
        title={req.id}
        backTo={backTo}
        backLabel="Back to requests"
        actions={
          <span className="pr-2">
            <RequestChip status={req.status} />
          </span>
        }
      />

      <div className="flex-1 space-y-3 p-4">
        <Card className="p-4">
          <p className="text-[14px] text-deep/70">Received {formatDateTime(req.received_at)}</p>
          <RequestStepper req={req} />
          {nexts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-sand pt-4">
              {nexts.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busyStatus}
                  onClick={() => (s === "closed" ? setConfirmClose(true) : move(s))}
                  className={buttonClass(
                    s === "closed" ? "secondary" : "primary",
                    "h-11 flex-1 text-[15px]",
                  )}
                >
                  {NEXT_LABEL[s]}
                </button>
              ))}
            </div>
          )}
          {req.order_id && (
            <Link
              to={`/admin/orders/${req.order_id}`}
              className="mt-4 flex min-h-12 items-center gap-2 rounded-[10px] bg-leaf/15 px-3 text-[15px] font-semibold text-forest"
            >
              <CircleCheck size={18} /> Order #{req.order_id} created · Open order
            </Link>
          )}
        </Card>

        <Card className="p-4">
          <CardTitle>Customer</CardTitle>
          <p className="text-[17px] font-semibold">{req.customer.name}</p>
          <p className="text-[15px] tabular-nums text-deep/80">{formatPhone(req.customer.phone)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={telHref(req.customer.phone)} className={buttonClass("secondary", "h-11")}>
              <Phone size={18} /> Call
            </a>
            <a
              href={whatsappHref(
                req.customer.phone,
                `Hi ${req.customer.name.split(" ")[0]}, this is SSV about your request for ${req.product_name}.`,
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary", "h-11")}
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
        </Card>

        <Card className="p-4">
          <CardTitle>Request</CardTitle>
          <dl className="grid grid-cols-2 gap-3 text-[15px]">
            <div>
              <dt className="text-[13px] text-deep/65">Product</dt>
              <dd className="font-semibold">{req.product_name}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-deep/65">Quantity</dt>
              <dd className="font-semibold tabular-nums">{req.quantity_kg} kg</dd>
            </div>
          </dl>
          <p className="mt-3 text-[13px] text-deep/65">Customisation</p>
          <p className="mt-1 text-[15px] leading-[1.55] whitespace-pre-line">
            {req.customisation || "No details given."}
          </p>
        </Card>

        <Card className="p-4">
          <TextAreaField
            label="Admin notes"
            hint="Only you can see this"
            placeholder="Price agreed, call outcomes, delivery plans…"
            value={draftNotes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <button
            type="button"
            disabled={!notesDirty || savingNotes}
            onClick={async () => {
              setSavingNotes(true);
              try {
                await saveAdminNotes(req.id, draftNotes);
                setNotes(null);
                toast({ message: "Notes saved" });
              } catch (e) {
                toast({ message: errorMessage(e), tone: "error" });
              } finally {
                setSavingNotes(false);
              }
            }}
            className={buttonClass("secondary", "mt-3 h-11")}
          >
            {savingNotes ? "Saving…" : notesDirty ? "Save notes" : "Saved"}
          </button>
        </Card>

        <Card className="p-4">
          <CardTitle
            action={
              <button
                type="button"
                onClick={() => setAddressOpen(true)}
                className={buttonClass("ghost", "-mr-2")}
              >
                <Plus size={18} /> Add address
              </button>
            }
          >
            Saved addresses
          </CardTitle>
          {req.addresses.length === 0 ? (
            <p className="py-2 text-[15px] text-deep/70">
              No saved addresses yet. Add one before creating an order.
            </p>
          ) : (
            <ul className="space-y-2">
              {req.addresses.map((a) => (
                <li key={a.id} className="flex gap-3 rounded-[10px] border border-sand p-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-forest" />
                  <div className="min-w-0 text-[15px] leading-[1.45]">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-deep/80">{formatAddress(a)}</p>
                    <p className="tabular-nums text-deep/70">{formatPhone(a.phone)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {canCreateOrder && (
        <ActionBar>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={buttonClass("primary", "w-full")}
          >
            Confirm and create order
          </button>
        </ActionBar>
      )}

      <ConfirmSheet
        open={confirmClose}
        title={`Close ${req.id}?`}
        message="Closed requests move out of your active list. You can't reopen them."
        confirmLabel="Close request"
        onConfirm={async () => {
          await move("closed");
          setConfirmClose(false);
        }}
        onClose={() => setConfirmClose(false)}
      />
      {addressOpen && <AddressSheet request={req} onClose={() => setAddressOpen(false)} />}
      {createOpen && (
        <CreateOrderSheet
          request={req}
          onClose={() => setCreateOpen(false)}
          onAddAddress={() => setAddressOpen(true)}
        />
      )}
    </div>
  );
}

function RequestStepper({ req }: { req: AdminCustomRequest }) {
  const reached = new Set(req.status_history.map((e) => e.status));
  return (
    <ol aria-label="Request progress" className="mt-4 grid grid-cols-4">
      {REQUEST_STEPS.map((step, i) => {
        const done = reached.has(step);
        const current = req.status === step;
        const skipped = !done && reached.has("closed");
        return (
          <li
            key={step}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 right-1/2 left-[-50%] h-0.5",
                  done ? "bg-forest" : "bg-sand",
                )}
              />
            )}
            <span
              className={cn(
                "relative grid size-7 place-items-center rounded-full text-[12px] font-bold",
                done ? "bg-forest text-cream" : "border-2 border-sand bg-white text-deep/50",
                current && step !== "closed" && "ring-4 ring-leaf/30",
              )}
            >
              {done ? <Check size={15} /> : i + 1}
            </span>
            <span
              className={cn(
                "mt-1.5 text-[12px] leading-tight",
                current ? "font-bold" : "text-deep/70",
                skipped && "line-through",
              )}
            >
              {REQUEST_STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type AddressDraft = Omit<AdminAddress, "id">;

function AddressSheet({ request, onClose }: { request: AdminCustomRequest; onClose: () => void }) {
  const toast = useToast();
  const [v, setV] = useState<AddressDraft>({
    name: request.customer.name,
    phone: request.customer.phone,
    door_no: "",
    street: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors: Partial<Record<keyof AddressDraft, string>> = {};
  if (!v.name.trim()) errors.name = "Enter the receiver's name.";
  if (!/^\d{10}$/.test(v.phone)) errors.phone = "Enter a 10-digit mobile number.";
  if (!v.door_no.trim()) errors.door_no = "Enter the door or flat number.";
  if (!v.street.trim()) errors.street = "Enter the street and area.";
  if (!v.city.trim()) errors.city = "Enter the city.";
  if (!v.state) errors.state = "Choose a state.";
  if (!/^\d{6}$/.test(v.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  const show = (k: keyof AddressDraft) => (submitted ? errors[k] : undefined);
  const bind = (k: keyof AddressDraft, digits = 0) => ({
    value: v[k],
    error: show(k),
    onChange: (e: { target: { value: string } }) =>
      setV((s) => ({
        ...s,
        [k]: digits ? e.target.value.replace(/\D/g, "").slice(0, digits) : e.target.value,
      })),
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await addCustomerAddress(request.id, {
        ...v,
        name: v.name.trim(),
        street: v.street.trim(),
        city: v.city.trim(),
      });
      toast({ message: "Address added" });
      onClose();
    } catch (err) {
      toast({ message: errorMessage(err), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Add address" description={`For ${request.customer.name}`}>
      <form onSubmit={submit} noValidate className="space-y-3.5">
        <TextField label="Name" autoComplete="name" {...bind("name")} />
        <TextField label="Phone" prefix="+91" inputMode="numeric" {...bind("phone", 10)} />
        <TextField label="Door number" {...bind("door_no")} />
        <TextField label="Street and area" {...bind("street")} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City" {...bind("city")} />
          <TextField label="Pincode" inputMode="numeric" {...bind("pincode", 6)} />
        </div>
        <SelectField label="State" {...bind("state")}>
          <option value="">Choose a state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <button type="submit" disabled={saving} className={buttonClass("primary", "mt-2 w-full")}>
          {saving ? "Saving…" : "Save address"}
        </button>
      </form>
    </Sheet>
  );
}

function CreateOrderSheet({
  request,
  onClose,
  onAddAddress,
}: {
  request: AdminCustomRequest;
  onClose: () => void;
  onAddAddress: () => void;
}) {
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [chosenAddress, setAddressId] = useState(request.addresses[0]?.id ?? "");
  // A freshly added address becomes the default choice.
  const addressId = chosenAddress || request.addresses[0]?.id || "";
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<AdminOrder | null>(null);
  const value = Number(price) || 0;
  const priceError =
    submitted && !(value > 0) ? "Enter the price you agreed with the customer." : undefined;
  const addressError = submitted && !addressId ? "Choose where to deliver." : undefined;

  const confirm = async () => {
    setSubmitted(true);
    if (!(value > 0) || !addressId) return;
    setSaving(true);
    try {
      setCreated(await createOrderFromRequest(request.id, { price: value, address_id: addressId }));
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <Sheet open onClose={onClose} title="Order created">
        <div role="status" className="py-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-cream">
            <Check size={28} />
          </span>
          <p className="mt-4 text-[20px] font-semibold">Order #{created.id} created</p>
          <p className="mt-1 text-[15px] text-deep/70">
            {formatINR(created.total)} · {created.items[0].weight_kg} kg {created.items[0].name}
          </p>
          <div className="mt-6 grid gap-2">
            <Link to={`/admin/orders/${created.id}`} className={buttonClass("primary", "w-full")}>
              Open order #{created.id}
            </Link>
            <button type="button" onClick={onClose} className={buttonClass("secondary", "w-full")}>
              Stay on request
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Confirm and create order"
      description={`${request.quantity_kg} kg ${request.product_name} for ${request.customer.name}`}
      footer={
        <button
          type="button"
          disabled={saving}
          onClick={confirm}
          className={buttonClass("primary", "w-full")}
        >
          {saving
            ? "Creating order…"
            : value > 0
              ? `Confirm order · ${formatINR(value)}`
              : "Confirm order"}
        </button>
      }
    >
      <TextField
        label="Agreed price"
        prefix="₹"
        inputMode="numeric"
        data-autofocus
        placeholder="0"
        value={price}
        error={priceError}
        hint="This is what the customer pays. Delivery is included; nothing is added."
        onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))}
      />
      <p className="mt-5 mb-2 text-[15px] font-semibold">Deliver to</p>
      {request.addresses.length === 0 ? (
        <div className="rounded-[12px] border border-sand bg-white p-4 text-[15px]">
          <p>This customer has no saved address.</p>
          <button
            type="button"
            onClick={onAddAddress}
            className={buttonClass("ghost", "-ml-3 mt-1")}
          >
            <Plus size={18} /> Add address
          </button>
        </div>
      ) : (
        <div role="radiogroup" aria-label="Delivery address" className="space-y-2">
          {request.addresses.map((a) => (
            <OptionRow
              key={a.id}
              selected={addressId === a.id}
              onClick={() => setAddressId(a.id)}
              title={a.name}
              text={formatAddress(a)}
            />
          ))}
        </div>
      )}
      {addressError && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-brick">
          {addressError}
        </p>
      )}
    </Sheet>
  );
}
