import { Suspense } from "react";
import SignInForm from "@/components/account/SignInForm";
export const metadata = { title: "Sign in" };
export default function SignInPage() {
  return (
    <div className="shell flex min-h-[70vh] items-center justify-center py-12">
      <Suspense fallback={<p>Loading sign in…</p>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
