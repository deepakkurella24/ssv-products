import { useRef, useState, type FormEvent } from "react";
import { INDIAN_STATES } from "@/data/states";
import type { Address } from "@/data/types";
import type { AddressInput } from "@/store/StoreProvider";
import { buttonStyles } from "@/lib/ui";
import { SelectField, TextField } from "./Field";

type Errors = Partial<Record<keyof AddressInput, string>>;

function validate(v: AddressInput): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Enter the name of the person receiving the order.";
  if (!/^\d{10}$/.test(v.phone)) e.phone = "Enter a 10-digit mobile number.";
  if (!v.door_no.trim()) e.door_no = "Enter the door or flat number.";
  if (!v.street.trim()) e.street = "Enter the street and area.";
  if (!v.city.trim()) e.city = "Enter the city.";
  if (!v.state) e.state = "Choose a state.";
  if (!/^\d{6}$/.test(v.pincode)) e.pincode = "Enter a 6-digit pincode.";
  return e;
}

interface AddressFormProps {
  initial?: Address;
  submitLabel: string;
  onSubmit: (value: AddressInput) => void;
  onCancel?: () => void;
}

export function AddressForm({ initial, submitLabel, onSubmit, onCancel }: AddressFormProps) {
  const [value, setValue] = useState<AddressInput>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    door_no: initial?.door_no ?? "",
    street: initial?.street ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof AddressInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = validate(value);
  const show = (key: keyof AddressInput) => (submitted || touched[key] ? errors[key] : undefined);
  const bind = (key: keyof AddressInput, digitsOnly = false) => ({
    value: value[key],
    onChange: (e: { target: { value: string } }) =>
      setValue((v) => ({
        ...v,
        [key]: digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value,
      })),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    error: show(key),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit({
      ...value,
      name: value.name.trim(),
      street: value.street.trim(),
      city: value.city.trim(),
    });
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
        <button type="submit" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
          {submitLabel}
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
