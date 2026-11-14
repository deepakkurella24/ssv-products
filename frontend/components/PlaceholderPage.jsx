import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { textLink } from "@/lib/ui";

export function PlaceholderPage({
  title,
  eyebrow = "Coming next",
  children,
}) {
  return (
    <section className="shell py-16 lg:py-24">
      <p className="text-[14px] font-semibold tracking-[0.08em] text-clay uppercase">{eyebrow}</p>
      <h1 className="mt-3 max-w-[720px] text-[36px] lg:text-[52px]">{title}</h1>
      <div className="mt-4 max-w-[560px] space-y-3 text-[17px] text-deep/80">
        {children ?? <p>This page is being designed and will be added soon.</p>}
      </div>
      <div className="mt-10 rounded-card border border-dashed border-clay/40 bg-sand/40 px-6 py-14 text-center text-[15px] text-deep/65">
        Page layout placeholder
      </div>
      <Link href="/" className={`${textLink} mt-8`}>
        <ArrowLeft aria-hidden size={16} /> Back to home
      </Link>
    </section>
  );
}

export default PlaceholderPage;
