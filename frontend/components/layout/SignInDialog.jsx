"use client";
import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useModal } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";

const messages = {
  "auth/popup-closed-by-user": "The sign-in window was closed. Please try again.",
  "auth/popup-blocked": "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
};

export function SignInDialog() {
  const { signInOpen, closeSignIn } = useStore();
  const { signInWithGoogle } = useAuth() || {};
  const panelRef = useRef(null);
  const titleId = useId();
  const errorId = useId();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useModal(signInOpen, closeSignIn, panelRef);

  if (!signInOpen) return null;

  async function handleGoogle() {
    if (!signInWithGoogle) return;
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      closeSignIn();
    } catch (err) {
      setError(messages[err.code] || err.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="on-light fixed inset-0 z-[60] grid place-items-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-deep/60"
        onClick={closeSignIn}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[420px] animate-drop-in rounded-card border border-sand bg-cream p-6 text-deep sm:p-8"
      >
        <button
          type="button"
          onClick={closeSignIn}
          aria-label="Close"
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full hover:bg-sand/70"
        >
          <X aria-hidden size={22} strokeWidth={1.75} />
        </button>
        <h2 id={titleId} className="pr-10 text-[28px]">
          Sign in to continue
        </h2>
        <p className="mt-2 text-deep/80">
          Sign in to add items to your cart and track your orders.
        </p>

        <div className="mt-6">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className={buttonStyles.forest("h-12 w-full text-[16px]")}
          >
            {loading ? "Please wait…" : "Continue with Google"}
          </button>
        </div>

        {error && (
          <p id={errorId} role="alert" className="mt-3 text-[15px] font-medium text-clay">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
