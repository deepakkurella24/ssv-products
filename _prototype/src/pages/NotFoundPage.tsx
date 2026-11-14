import { Link } from "react-router";
import { buttonStyles } from "@/lib/ui";

export default function NotFoundPage() {
  return (
    <section className="shell py-20 lg:py-28">
      <title>Page not found · SSV</title>
      <p className="text-[14px] font-semibold tracking-[0.08em] text-clay uppercase">404</p>
      <h1 className="mt-3 max-w-[720px] text-[36px] lg:text-[52px]">We could not find that page</h1>
      <p className="mt-4 max-w-[520px] text-[17px] text-deep/80">
        The link may be old, or the product may have been renamed or removed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/products" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
          See all products
        </Link>
        <Link to="/" className={buttonStyles.outline()}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
