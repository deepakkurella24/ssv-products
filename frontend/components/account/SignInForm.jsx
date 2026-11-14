"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const messages = {
  "auth/popup-closed-by-user": "The sign-in window was closed. Please try again.",
  "auth/popup-blocked": "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/account-exists-with-different-credential": "An account already exists with a different sign-in method.",
};

export default function SignInForm() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);

  const next = params.get("next");
  const defaultDestination =
    auth.role === "admin" ? "/admin" : "/account/orders";
  const destination =
    next?.startsWith("/") && !next.startsWith("//") ? next : defaultDestination;

  useEffect(() => {
    if (!redirectPending || auth.loading) return;
    if (auth.firebaseUser) {
      // If the user is an admin, always send to /admin regardless of `next`
      router.replace(auth.role === "admin" ? "/admin" : destination);
    } else {
      setRedirectPending(false);
      setError("We couldn't verify your account. Please try signing in again.");
    }
  }, [redirectPending, auth.loading, auth.firebaseUser, auth.role, router, destination]);

  async function handleGoogle() {
    setBusy(true);
    setError("");
    try {
      await auth.signInWithGoogle();
      setRedirectPending(true);
    } catch (e) {
      setError(messages[e.code] || e.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!auth.configured)
    return (
      <p className="rounded-card bg-sand p-4">
        Sign in is unavailable until Firebase environment variables are configured.
      </p>
    );

  return (
    <div className="w-full max-w-md rounded-card border border-sand bg-cream p-6 shadow-warm sm:p-8">
      <h1 className="mb-6 text-[28px]">Sign in</h1>
      <p className="mb-6 text-deep/75">
        Use your Google account to sign in or create an account.
      </p>
      <button
        className="button-outline w-full"
        disabled={busy || redirectPending || auth.loading}
        onClick={handleGoogle}
      >
        {busy || redirectPending || auth.loading ? "Please wait…" : "Continue with Google"}
      </button>
      {error && (
        <p className="mt-4 text-sm text-brick" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
