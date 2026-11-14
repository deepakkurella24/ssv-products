import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { SignInDialog } from "@/components/layout/SignInDialog";

export default function PublicLayout({ children }) {
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
        {children}
      </main>
      <Footer />
      <SearchOverlay />
      <SignInDialog />
    </>
  );
}
