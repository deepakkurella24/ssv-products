"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LeafBranch } from "@/components/Decor";
import { TextAreaField, TextField } from "@/components/Field";
import { useCategories, useProducts } from "@/lib/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { createCustomRequest } from "@/lib/api/user";
import { buttonStyles } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const DRAFT_KEY = "ssv.custom-draft";
const EMPTY = { item: "", qty: "", details: "", mobile: "" };

function loadDraft() {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

const DEFAULT_SUGGESTIONS = [
  "Cold Pressed Sesame Oil",
  "Forest Honey",
  "Coconut Oil",
  "Groundnut Oil",
  "Turmeric Powder",
  "Red Chilli Powder",
];

function parseKg(value) {
  const n = Number(value.replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

function validate(d) {
  const errors = {};
  if (!d.item?.trim() || d.item.trim().length < 2)
    errors.item = "Tell us what you are looking for, for example “forest honey”.";
  const kg = parseKg(d.qty || "");
  if (!d.qty?.trim() || !(kg > 0)) errors.qty = "Enter the quantity in kg, for example 5 or 2.5.";
  else if (kg > 10000)
    errors.qty =
      "That is a very large amount. Please write the details below and we will call you.";
  if (!/^\d{10}$/.test(d.mobile || "")) errors.mobile = "Enter a 10-digit mobile number, without +91.";
  return errors;
}

const spaced = (m) => `${m.slice(0, 5)} ${m.slice(5)}`;

export function CustomOrderScreen() {
  const { user, requireAuth } = useStore();
  const { firebaseUser } = useAuth();
  const { products = [] } = useProducts();
  const { categories = [] } = useCategories();
  const [draft, setDraft] = useState(loadDraft);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [sentMobile, setSentMobile] = useState("");
  const formRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (status !== "success") {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Draft persistence is optional when browser storage is unavailable.
      }
    }
  }, [draft, status]);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const errors = validate(draft);
  const show = (key) => (submitted || touched[key] ? errors[key] : undefined);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const suggestions = useMemo(() => {
    const term = (draft.item || "").trim().toLowerCase();
    const suggestionsList =
      products.length > 0
        ? [
            ...[...products]
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
              .map((p) => p.name),
            ...categories.map((c) => c.name),
          ]
        : DEFAULT_SUGGESTIONS;
    const list = term
      ? suggestionsList.filter((s) => s.toLowerCase().includes(term))
      : suggestionsList.slice(0, 6);
    return list.filter((s) => s.toLowerCase() !== term).slice(0, 6);
  }, [draft.item, products, categories]);

  const send = async () => {
    setStatus("sending");
    const input = {
      name: user?.name || firebaseUser?.displayName || "Customer",
      contact: user?.email || firebaseUser?.email || draft.mobile,
      mobile: draft.mobile,
      preferred_product: draft.item.trim(),
      item: draft.item.trim(),
      quantity_kg: String(draft.qty || "").trim(),
      customization_text: draft.details.trim() || draft.item.trim(),
      details: draft.details.trim(),
    };
    try {
      const token = await firebaseUser?.getIdToken();
      await createCustomRequest(input, token);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Submission succeeds even when browser storage is unavailable.
      }
      setSentMobile(draft.mobile);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (status === "sending") return;
    setSubmitted(true);
    const first = ["item", "qty", "mobile"].find((k) => errors[k]);
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    requireAuth(send);
  };

  const reset = () => {
    setDraft(EMPTY);
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
  };

  return (
    <div className="relative overflow-hidden">
      <LeafBranch className="pointer-events-none absolute -right-16 -bottom-10 hidden h-[520px] text-forest opacity-[0.07] lg:block" />
      <div className="shell relative pt-6 pb-20 lg:pt-8 lg:pb-28">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Custom order" }]} />

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
          <div className="max-w-[460px]">
            <h1 className="text-[36px] sm:text-[44px] lg:text-[52px]">
              Tell us what you need, <em className="font-medium italic">we will call you</em>
            </h1>
            <p className="mt-5 text-[18px] text-deep/85">
              Looking for a larger quantity, or something that is not on the site? Write it down
              here. Our team will call you to confirm.
            </p>
            <ol className="mt-8 space-y-4 text-[16px]">
              {[
                "Tell us the item and how much you need.",
                "Our team calls you to confirm the details.",
                "We deliver once everything is agreed.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="w-5 shrink-0 font-display text-[26px] leading-none font-semibold text-clay tabular-nums">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-card border border-sand bg-cream p-5 sm:p-8">
            {status === "success" ? (
              <div role="status">
                <CircleCheck aria-hidden size={40} className="text-forest" />
                <h2
                  ref={successRef}
                  tabIndex={-1}
                  className="mt-4 text-[28px] outline-none sm:text-[32px]"
                >
                  Thanks, we’ve received your request
                </h2>
                <p className="mt-3 text-[17px] text-deep/90">
                  Our team will call you on{" "}
                  <strong className="tabular-nums">+91 {spaced(sentMobile)}</strong> to confirm.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/account/custom-requests"
                    className={buttonStyles.forest("h-12 px-6 text-[16px]")}
                  >
                    View my requests
                  </Link>
                  <button type="button" onClick={reset} className={buttonStyles.outline()}>
                    Send another request
                  </button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
                {status === "error" && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-[10px] border border-clay bg-sand/50 p-4 text-[15px] text-deep"
                  >
                    <CircleAlert aria-hidden size={20} className="mt-0.5 shrink-0 text-clay" />
                    <p>
                      <strong>We could not send your request.</strong> Please check your internet
                      connection and try again. What you typed is still here.
                    </p>
                  </div>
                )}

                <div>
                  <TextField
                    label="What are you looking for?"
                    name="item"
                    required
                    autoComplete="off"
                    placeholder="For example, cold pressed sesame oil"
                    value={draft.item}
                    onChange={(e) => set("item", e.target.value)}
                    onBlur={blur("item")}
                    error={show("item")}
                  />
                  {suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[14px] text-deep/70">From our catalogue</p>
                      <ul className="mt-1.5 flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => set("item", s)}
                              className="h-9 rounded-full border border-deep/30 px-3.5 text-[14px] font-medium transition-colors hover:border-forest hover:bg-sand/60"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <TextField
                    label="How much do you need?"
                    name="qty"
                    required
                    inputMode="decimal"
                    suffix="kg"
                    placeholder="5"
                    value={draft.qty}
                    onChange={(e) => set("qty", e.target.value.replace(/[^\d.,]/g, ""))}
                    onBlur={blur("qty")}
                    error={show("qty")}
                  />
                  <ul className="mt-2 flex flex-wrap gap-2" aria-label="Common quantities">
                    {[5, 10, 25, 50].map((n) => (
                      <li key={n}>
                        <button
                          type="button"
                          onClick={() => set("qty", String(n))}
                          className={cn(
                            "h-9 rounded-full border px-3.5 text-[14px] font-medium tabular-nums transition-colors",
                            draft.qty === String(n)
                              ? "border-forest bg-forest text-cream"
                              : "border-deep/30 hover:border-forest hover:bg-sand/60",
                          )}
                        >
                          {n} kg
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <TextAreaField
                  label="Tell us any details"
                  name="details"
                  hint="Optional. Tell the details we should know."
                  maxLength={500}
                  value={draft.details}
                  onChange={(e) => set("details", e.target.value)}
                />

                <TextField
                  label="Mobile number"
                  name="mobile"
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  prefix="+91"
                  maxLength={10}
                  placeholder="10-digit number"
                  hint="We will call you on this number."
                  value={draft.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                  onBlur={blur("mobile")}
                  error={show("mobile")}
                />

                <div>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className={buttonStyles.marigold("w-full disabled:opacity-70")}
                  >
                    {status === "sending" ? (
                      <>
                        <LoaderCircle aria-hidden size={20} className="animate-spin" /> Sending…
                      </>
                    ) : status === "error" ? (
                      "Try again"
                    ) : (
                      "Send my request"
                    )}
                  </button>
                  {!user && (
                    <p className="mt-3 text-center text-[14px] text-deep/75">
                      You will be asked to sign in when you send this. Your answers will not be
                      lost.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomOrderScreen;
