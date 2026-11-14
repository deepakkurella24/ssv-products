"use client";
import { useId, useState } from "react";
import { Link } from "@/components/admin/router-compat";
import { AlertCircle, ArrowLeft, Minus, Plus, SearchX, WifiOff } from "lucide-react";
import { ImageSlot } from "@/components/ImageSlot";
import { cn } from "@/lib/utils";
export function buttonClass(variant = "primary", extra) {
  const base = "inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "h-12 bg-forest px-5 text-[16px] text-cream hover:bg-forest-dark",
    secondary: "h-12 border border-deep/25 bg-white px-5 text-[16px] text-deep hover:bg-sand/50",
    danger: "h-12 bg-brick px-5 text-[16px] text-white hover:bg-brick/90",
    ghost: "h-11 px-3 text-[15px] text-forest hover:bg-sand/60"
  };
  return cn(base, styles[variant], extra);
}
export function IconButton({
  label,
  className,
  children,
  ...props
}) {
  return <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "relative grid size-11 shrink-0 place-items-center rounded-full text-deep transition-colors hover:bg-sand/70 disabled:opacity-40",
      className
    )}
    {...props}
  >
      {children}
    </button>;
}
export function Card({ className, children, ...props }) {
  return <div className={cn("rounded-card border border-sand bg-white", className)} {...props}>
      {children}
    </div>;
}
export function CardTitle({ children, action }) {
  return <div className="flex min-h-11 items-center justify-between gap-3">
      <h2 className="text-[13px] font-semibold tracking-[0.06em] text-deep/70 uppercase">
        {children}
      </h2>
      {action}
    </div>;
}
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className
}) {
  return <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "grid h-11 w-14 shrink-0 place-items-center rounded-full disabled:opacity-50",
      className
    )}
  >
      <span
    className={cn(
      "relative block h-7 w-12 rounded-full transition-colors",
      checked ? "bg-forest" : "bg-deep/25"
    )}
  >
        <span
    className={cn(
      "absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform",
      checked && "translate-x-5"
    )}
  />
      </span>
    </button>;
}
export function Segmented({
  options,
  value,
  onChange,
  label
}) {
  return <div role="radiogroup" aria-label={label} className="flex rounded-[12px] bg-sand/70 p-1">
      {options.map((o) => <button
    key={o.value}
    type="button"
    role="radio"
    aria-checked={value === o.value}
    onClick={() => onChange(o.value)}
    className={cn(
      "min-h-11 flex-1 rounded-[9px] px-2 text-[15px] font-semibold transition-colors",
      value === o.value ? "bg-white text-deep shadow-[0_1px_0_var(--color-sand)]" : "text-deep/70 hover:text-deep"
    )}
  >
          {o.label}
        </button>)}
    </div>;
}
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  suffix
}) {
  return <div
    role="group"
    aria-label={label}
    className="inline-flex h-12 items-center rounded-[12px] border border-deep/25 bg-white"
  >
      <IconButton
    label={`Decrease ${label}`}
    disabled={value <= min}
    onClick={() => onChange(value - 1)}
  >
        <Minus size={18} />
      </IconButton>
      <span
    aria-live="polite"
    className="min-w-16 text-center text-[16px] font-semibold tabular-nums"
  >
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
      <IconButton
    label={`Increase ${label}`}
    disabled={value >= max}
    onClick={() => onChange(value + 1)}
  >
        <Plus size={18} />
      </IconButton>
    </div>;
}
const inputBox = (invalid) => cn(
  "flex min-h-12 w-full items-stretch overflow-hidden rounded-[10px] border bg-white transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest",
  invalid ? "border-brick" : "border-deep/30"
);
const inputEl = "min-w-0 flex-1 bg-transparent px-3.5 text-[16px] text-deep outline-none placeholder:text-deep/45";
function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children
}) {
  return <div className={className}>
      <label
    htmlFor={id}
    className="mb-1.5 flex items-baseline justify-between gap-2 text-[15px] font-semibold"
  >
        {label}
        {optional && <span className="text-[13px] font-normal text-deep/60">Optional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-deep/65">
          {hint}
        </p>}
      {error && <p
    id={`${id}-error`}
    role="alert"
    className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-brick"
  >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>}
    </div>;
}
const describedBy = (id, error, hint) => error ? `${id}-error` : hint ? `${id}-hint` : void 0;
export function TextField({
  label,
  error,
  hint,
  optional,
  className,
  prefix,
  suffix,
  id,
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldShell
    id={fid}
    label={label}
    error={error}
    hint={hint}
    optional={optional}
    className={className}
  >
      <div className={inputBox(!!error)}>
        {prefix && <span className="flex items-center pl-3.5 text-[16px] font-semibold text-deep/70">
            {prefix}
          </span>}
        <input
    id={fid}
    aria-invalid={!!error}
    aria-describedby={describedBy(fid, error, hint)}
    className={cn(inputEl, prefix && "pl-1.5")}
    {...props}
  />
        {suffix && <span className="flex items-center pr-2">{suffix}</span>}
      </div>
    </FieldShell>;
}
export function TextAreaField({
  label,
  error,
  hint,
  optional,
  className,
  id,
  value = "",
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldShell
    id={fid}
    label={label}
    error={error}
    hint={hint}
    optional={optional}
    className={className}
  >
      <div className={inputBox(!!error)}>
        <textarea
    id={fid}
    value={value ?? ""}
    aria-invalid={!!error}
    aria-describedby={describedBy(fid, error, hint)}
    className={cn(inputEl, "min-h-24 resize-y py-3 leading-[1.5]")}
    {...props}
  />
      </div>
    </FieldShell>;
}
export function SelectField({
  label,
  error,
  hint,
  optional,
  className,
  id,
  children,
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldShell
    id={fid}
    label={label}
    error={error}
    hint={hint}
    optional={optional}
    className={className}
  >
      <div className={inputBox(!!error)}>
        <select
    id={fid}
    aria-invalid={!!error}
    aria-describedby={describedBy(fid, error, hint)}
    className={cn(inputEl, "appearance-none")}
    {...props}
  >
          {children}
        </select>
      </div>
    </FieldShell>;
}
export function Thumb({
  src,
  size = 56,
  className
}) {
  return <span
    className={cn(
      "block shrink-0 overflow-hidden rounded-[10px] border border-sand bg-sand",
      className
    )}
    style={{ width: size, height: size }}
  >
      <ImageSlot src={src} alt="" size="compact" className="bg-sand" />
    </span>;
}
export function Skeleton({ className }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-[8px] bg-sand", className)} />;
}
export function ListSkeleton({ rows = 6 }) {
  return <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => <Card key={i} className="space-y-2.5 p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </Card>)}
    </div>;
}
export function EmptyState({
  icon: Icon = SearchX,
  title,
  text,
  action
}) {
  return <div className="px-4 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-sand text-forest">
        <Icon size={22} />
      </span>
      <p className="mt-4 text-[17px] font-semibold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-[320px] text-[15px] text-deep/70">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>;
}
export function ErrorState({ message, onRetry }) {
  const offline = /offline/i.test(message);
  return <div role="alert" className="px-4 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-brick/10 text-brick">
        {offline ? <WifiOff size={22} /> : <AlertCircle size={22} />}
      </span>
      <p className="mt-4 text-[17px] font-semibold">
        {offline ? "No connection" : "Couldn't load this"}
      </p>
      <p className="mx-auto mt-1 max-w-[320px] text-[15px] text-deep/70">{message}</p>
      <button type="button" onClick={onRetry} className={buttonClass("secondary", "mt-5")}>
        Try again
      </button>
    </div>;
}
export function AppBar({
  title,
  backTo,
  onBack,
  backLabel = "Back",
  backAlways = false,
  actions,
  children
}) {
  const backClass = cn(
    "grid size-11 shrink-0 place-items-center rounded-full hover:bg-sand/70",
    !backAlways && "md:hidden"
  );
  return <header className="sticky top-0 z-20 border-b border-sand bg-cream">
      <div className="flex h-14 items-center gap-1 px-2">
        {backTo !== void 0 ? <Link to={backTo} aria-label={backLabel} className={backClass}>
            <ArrowLeft size={22} />
          </Link> : onBack ? <button type="button" onClick={onBack} aria-label={backLabel} className={backClass}>
            <ArrowLeft size={22} />
          </button> : null}
        <h1
    className={cn(
      "min-w-0 flex-1 truncate font-display text-[20px] font-semibold",
      !backTo && !onBack && "pl-2",
      !backAlways && (backTo !== void 0 || onBack) && "md:pl-2"
    )}
  >
          {title}
        </h1>
        {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
      </div>
      {children}
    </header>;
}
export function FilterChips({
  options,
  value,
  onChange,
  label
}) {
  return <div
    role="group"
    aria-label={label}
    className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3"
  >
      {options.map((o) => {
    const active = o.value === value;
    return <button
      key={o.value}
      type="button"
      aria-pressed={active}
      onClick={() => onChange(o.value)}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors",
        active ? "border-forest bg-forest text-cream" : "border-sand bg-white text-deep hover:border-deep/30"
      )}
    >
            {o.label}
            {o.count !== void 0 && <span
      className={cn(
        "min-w-6 rounded-full px-1.5 text-center text-[12px] tabular-nums",
        active ? "bg-cream/20 text-cream" : "bg-sand text-deep/80"
      )}
    >
                {o.count}
              </span>}
          </button>;
  })}
    </div>;
}
export function SearchRow({
  value,
  onChange,
  placeholder,
  label,
  inputMode
}) {
  return <div className="px-4 pb-3">
      <label className="sr-only" htmlFor="admin-search">
        {label}
      </label>
      <input
    id="admin-search"
    data-autofocus
    autoFocus
    type="search"
    inputMode={inputMode}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-12 w-full rounded-[10px] border border-deep/30 bg-white px-3.5 text-[16px] outline-none placeholder:text-deep/45 focus:outline-2 focus:outline-offset-2 focus:outline-forest"
  />
    </div>;
}
export function Fab({
  label,
  onClick,
  icon
}) {
  return <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="admin-fab fixed right-4 z-20 grid size-14 place-items-center rounded-full bg-forest text-cream shadow-warm hover:bg-forest-dark md:hidden"
  >
      {icon}
    </button>;
}
export function SaveBar({
  onCancel,
  saving,
  saveLabel = "Save",
  cancelLabel = "Cancel"
}) {
  return <div className="admin-safe-bottom sticky bottom-0 z-10 flex gap-3 border-t border-sand bg-cream px-4 pt-3">
      <button type="button" onClick={onCancel} className={buttonClass("secondary", "flex-1")}>
        {cancelLabel}
      </button>
      <button type="submit" disabled={saving} className={buttonClass("primary", "flex-[2]")}>
        {saving ? "Saving\u2026" : saveLabel}
      </button>
    </div>;
}
export function ActionBar({ children }) {
  return <div className="admin-safe-bottom sticky bottom-0 z-10 border-t border-sand bg-cream px-4 pt-3">
      {children}
    </div>;
}
export function usePaged(items, size = 30) {
  const [count, setCount] = useState(size);
  return {
    visible: items.slice(0, count),
    hasMore: items.length > count,
    more: () => setCount((c) => c + size),
    remaining: Math.max(0, items.length - count)
  };
}
