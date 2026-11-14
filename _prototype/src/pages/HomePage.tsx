import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryTile } from "@/components/CategoryTile";
import { ProductGrid } from "@/components/ProductGrid";
import { CustomOrderBanner } from "@/components/CustomOrderBanner";
import { CATEGORIES } from "@/data/categories";
import { useProducts } from "@/lib/hooks";
import { buttonStyles, textLink } from "@/lib/ui";

export default function HomePage() {
  const { products, loading } = useProducts();

  return (
    <>
      <title>SSV · Natural, chemical-free oils, honey, spices and pooja samagri</title>
      <HeroSlider />

      <section aria-labelledby="categories-heading" className="shell pt-16 pb-14 lg:pt-24 lg:pb-20">
        <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
          <h2 id="categories-heading" className="text-[30px] sm:text-[36px] lg:text-[42px]">
            Shop by category
          </h2>
          <Link to="/products" className={`${textLink} shrink-0 pb-1 text-[15px]`}>
            All products <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
        <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {CATEGORIES.map((category) => (
            <li
              key={category.id}
              className="w-[44vw] max-w-[230px] shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <CategoryTile category={category} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="products-heading" className="shell pb-20 lg:pb-28">
        <div className="grid gap-3 border-t border-sand pt-12 pb-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10 lg:pt-16 lg:pb-10">
          <h2 id="products-heading" className="text-[30px] sm:text-[36px] lg:text-[42px]">
            Our Products
          </h2>
          <p className="max-w-[420px] text-[16px] text-deep/80 lg:text-right">
            Everyday staples made without chemicals or preservatives. Pick a size and add it to your
            cart.
          </p>
        </div>
        <ProductGrid products={products.slice(0, 8)} loading={loading} />
        <div className="mt-10 flex justify-center lg:mt-12">
          <Link to="/products" className={buttonStyles.outline()}>
            View all products <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </section>

      <CustomOrderBanner />
    </>
  );
}
