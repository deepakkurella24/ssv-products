import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchOverlay } from "@/components/SearchOverlay";
import { SignInDialog } from "@/components/SignInDialog";
import { LoadingScreen } from "@/components/LoadingScreen";

export function RootLayout() {
  return (
    <>
      <a
        href="#main"
        className="on-light fixed top-2 left-2 z-[70] -translate-y-[150%] rounded-full bg-cream px-4 py-2 font-semibold text-deep focus:translate-y-0"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="pt-[72px] outline-none lg:pt-24">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <SearchOverlay />
      <SignInDialog />
      <ScrollRestoration />
    </>
  );
}
