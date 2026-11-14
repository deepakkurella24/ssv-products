"use client";

import { useId } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Input borders use deep green at 40% so the field edge stays visible (3:1) on cream.
const box = (invalid) =>
  cn(
    "mt-1.5 flex min-h-12 w-full items-stretch overflow-hidden rounded-[10px] border bg-cream transition-colors",
    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest",
    invalid ? "border-clay" : "border-deep/40 hover:border-deep/70 focus-within:border-forest",
  );

const control =
  "min-w-0 flex-1 bg-transparent px-4 text-[16px] text-deep placeholder:text-deep/50 outline-none";

function Shell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
        {required && (
          <span aria-hidden className="text-clay">
            {" "}
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-[14px] text-deep/70">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[14px] font-medium text-clay"
        >
          <CircleAlert aria-hidden size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id, hint, error) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextField({
  label,
  error,
  hint,
  className,
  prefix,
  suffix,
  required,
  id,
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell
      id={fid}
      label={label}
      hint={hint}
      error={error}
      className={className}
      required={required}
    >
      <div className={box(!!error)}>
        {prefix && (
          <span className="flex items-center border-r border-deep/25 bg-sand/60 px-3.5 text-[16px] font-medium">
            {prefix}
          </span>
        )}
        <input
          id={fid}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={describedBy(fid, hint, error)}
          className={control}
          {...props}
        />
        {suffix && (
          <span className="flex items-center pr-4 text-[15px] text-deep/70">{suffix}</span>
        )}
      </div>
    </Shell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  required,
  id,
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell
      id={fid}
      label={label}
      hint={hint}
      error={error}
      className={className}
      required={required}
    >
      <div className={box(!!error)}>
        <textarea
          id={fid}
          aria-invalid={!!error}
          aria-describedby={describedBy(fid, hint, error)}
          className={cn(control, "min-h-28 resize-y py-3")}
          {...props}
        />
      </div>
    </Shell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  required,
  id,
  children,
  ...props
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell
      id={fid}
      label={label}
      hint={hint}
      error={error}
      className={className}
      required={required}
    >
      <div className={cn(box(!!error), "relative")}>
        <select
          id={fid}
          aria-invalid={!!error}
          aria-describedby={describedBy(fid, hint, error)}
          className={cn(control, "appearance-none pr-10")}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          size={18}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
        />
      </div>
    </Shell>
  );
}
