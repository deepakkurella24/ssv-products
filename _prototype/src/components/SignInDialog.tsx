import { useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import { useStore } from "@/store/StoreProvider";
import { useModal } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";

export function SignInDialog() {
  const { signInOpen, closeSignIn, signIn } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const idField = useId();
  const passwordField = useId();
  const errorId = useId();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useModal(signInOpen, closeSignIn, panelRef);

  if (!signInOpen) return null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const id = identifier.trim();
    if (!id || !password) {
      setError("Enter your mobile number or email, and your password.");
      return;
    }
    const isEmail = id.includes("@");
    const name = isEmail
      ? id
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "SSV Customer";
    signIn({ name, email: isEmail ? id : `+91 ${id.replace(/^\+?91/, "")}` });
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const fieldClass =
    "mt-1.5 h-12 w-full rounded-[10px] border border-sand bg-cream px-4 text-[16px] placeholder:text-deep/50 focus:border-forest focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

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
          <X aria-hidden size={22} />
        </button>
        <h2 id={titleId} className="pr-10 text-[28px]">
          Sign in to continue
        </h2>
        <p className="mt-2 text-deep/80">
          Sign in to add items to your cart and track your orders.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor={idField} className="text-[15px] font-semibold">
              Mobile number or email
            </label>
            <input
              id={idField}
              data-autofocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              aria-describedby={error ? errorId : undefined}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={passwordField} className="text-[15px] font-semibold">
              Password
            </label>
            <input
              id={passwordField}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-describedby={error ? errorId : undefined}
              className={fieldClass}
            />
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-[15px] font-medium text-clay">
              {error}
            </p>
          )}
          <button type="submit" className={buttonStyles.forest("h-12 w-full text-[16px]")}>
            Sign in
          </button>
        </form>

        <p className="mt-5 text-[15px] text-deep/80">
          New to SSV?{" "}
          <Link
            to="/account"
            onClick={closeSignIn}
            className="font-semibold text-forest underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-4 border-t border-sand pt-4 text-[13px] text-deep/60">
          Preview only: sign-in is simulated until the accounts API is connected.
        </p>
      </div>
    </div>
  );
}
