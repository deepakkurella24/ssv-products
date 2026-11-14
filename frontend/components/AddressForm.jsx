"use client";

import { useRef, useState } from "react";
import { INDIAN_STATES } from "@/lib/states";
import { buttonStyles } from "@/lib/ui";
import { SelectField, TextField } from "./Field";

function validate(v) {
  const e = {};
  if (!v.name?.trim()) e.name = "Enter the name of the person receiving the order.";
  if (!/^\d{10}$/.test(v.phone || "")) e.phone = "Enter a 10-digit mobile number.";
  if (!v.door_no?.trim()) e.door_no = "Enter the door or flat number.";
  if (!v.street?.trim()) e.street = "Enter the street and area.";
  if (!v.city?.trim()) e.city = "Enter the city.";
  if (!v.state) e.state = "Choose a state.";
  if (!/^\d{6}$/.test(v.pincode || "")) e.pincode = "Enter a 6-digit pincode.";
  return e;
}

export function AddressForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [value, setValue] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    door_no: initial?.door_no ?? "",
    street: initial?.street ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const errors = validate(value);
  const show = (key) => (submitted || touched[key] ? errors[key] : undefined);
  const bind = (key, digitsOnly = false) => ({
    value: value[key],
    onChange: (e) =>
      setValue((v) => ({
        ...v,
        [key]: digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value,
      })),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    error: show(key),
  });

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...value,
        name: (value.name || "").trim(),
        street: (value.street || "").trim(),
        city: (value.city || "").trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        required
        className="sm:col-span-2"
        {...bind("name")}
      />
      <TextField
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        autoComplete="tel-national"
        prefix="+91"
        required
        className="sm:col-span-2"
        {...bind("phone", true)}
      />
      <TextField
        label="Door / flat no."
        name="door_no"
        autoComplete="address-line1"
        required
        {...bind("door_no")}
      />
      <TextField
        label="Street and area"
        name="street"
        autoComplete="address-line2"
        required
        {...bind("street")}
      />
      <TextField
        label="City"
        name="city"
        autoComplete="address-level2"
        required
        {...bind("city")}
      />
      <SelectField
        label="State"
        name="state"
        autoComplete="address-level1"
        required
        {...bind("state")}
      >
        <option value="">Choose a state</option>
        {INDIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Pincode"
        name="pincode"
        inputMode="numeric"
        maxLength={6}
        autoComplete="postal-code"
        required
        {...bind("pincode", true)}
      />
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={buttonStyles.outline("h-12 px-6 text-[16px]")}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default AddressForm;
