import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-deep/75">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const href = item.to || item.href;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {href && !last ? (
                  <Link
                    href={href}
                    className="rounded-sm underline-offset-4 hover:text-forest hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={last ? "font-semibold text-deep" : ""}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden className="text-deep/45">
                  <ChevronRight size={14} strokeWidth={1.75} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
