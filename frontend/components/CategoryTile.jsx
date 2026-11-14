import Link from "next/link";
import { categoryHref } from "@/lib/categories";
import { ImageSlot } from "./ImageSlot";

export function CategoryTile({ category }) {
  if (!category) return null;
  return (
    <Link href={categoryHref(category.slug)} className="group block rounded-t-full rounded-b-card">
      <div className="aspect-[4/5] overflow-hidden rounded-t-full bg-slot">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <ImageSlot
            src={category.image_url}
            alt={category.name}
            captionClassName="inset-x-4 bottom-4 lg:inset-x-5 lg:bottom-5"
          />
        </div>
      </div>
      <h3 className="mt-4 text-[19px] leading-tight lg:text-[21px]">
        <span className="decoration-1 underline-offset-[5px] group-hover:underline">
          {category.name}
        </span>
      </h3>
      <p className="mt-1 text-[14px] text-clay tabular-nums">
        {category.product_count} {category.product_count === 1 ? "product" : "products"}
      </p>
    </Link>
  );
}
