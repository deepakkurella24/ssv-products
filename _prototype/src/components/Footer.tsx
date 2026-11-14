import { Link } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { CATEGORIES, categoryHref } from "@/data/categories";
import { COMPANY_LINKS, CONTACT, SOCIAL } from "@/data/site";
import { LockupOnDark } from "./Logo";
import { SOCIAL_ICONS } from "./SocialIcons";

const heading = "font-sans text-[13px] font-semibold tracking-[0.1em] text-marigold uppercase";
const link =
  "rounded-sm text-[15px] text-cream/85 underline-offset-4 decoration-1 hover:text-cream hover:underline";

export function Footer() {
  return (
    <footer className="on-dark relative bg-forest text-cream">
      <div aria-hidden className="leaf-texture absolute inset-0" />
      <div className="shell relative grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr] lg:gap-12 lg:py-16">
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" aria-label="SSV home" className="inline-block rounded-md p-1">
            <LockupOnDark className="h-14" />
          </Link>
          <p className="mt-4 max-w-[300px] text-[15px] text-cream/85">
            Cold pressed oils, forest honey, spices and pooja samagri, made without chemicals.
          </p>
          <ul className="mt-5 flex gap-2">
            {SOCIAL.map((item) => {
              const Icon = SOCIAL_ICONS[item.label];
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-label={`SSV on ${item.label}`}
                    className="grid size-11 place-items-center rounded-full border border-cream/25 text-cream transition-colors hover:bg-cream/10"
                  >
                    <Icon />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className={heading}>
            Shop
          </h2>
          <ul className="mt-4 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link to={categoryHref(c.slug)} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/custom-order" className={link}>
                Custom orders
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className={heading}>
            Company
          </h2>
          <ul className="mt-4 space-y-2.5">
            {COMPANY_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 lg:col-span-1">
          <h2 className={heading}>Contact</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-cream/85">
            <li className="flex gap-3">
              <MapPin aria-hidden size={18} className="mt-0.5 shrink-0 text-marigold" />
              <address className="not-italic">
                SSV
                {CONTACT.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </li>
            <li className="flex gap-3">
              <Phone aria-hidden size={18} className="mt-0.5 shrink-0 text-marigold" />
              <span className="tabular-nums">{CONTACT.phone}</span>
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden size={18} className="mt-0.5 shrink-0 text-marigold" />
              <span>{CONTACT.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-cream/15">
        <div className="shell flex flex-col gap-2 py-5 text-[14px] text-cream/75 md:flex-row md:items-center md:justify-between">
          <p>© 2026 SSV. All rights reserved.</p>
          <p className="tabular-nums">FSSAI Lic. No. {CONTACT.fssai}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Cash on delivery · Online payment</span>
            <Link
              to="/admin"
              className="font-semibold text-marigold underline underline-offset-4 hover:text-cream"
            >
              Admin panel (prototype)
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
