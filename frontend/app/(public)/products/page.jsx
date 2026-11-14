import { Suspense } from "react";
import ProductsScreen from "@/components/product/ProductsScreen";
import { getCategory } from "@/lib/api/public";

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const category = query?.sub || query?.category;
  if (!category) return { title: "All products · SSV" };
  try {
    const item = await getCategory(category);
    return {
      title: `${item.name} · SSV`,
      description: item.description || `Shop ${item.name} from SSV.`,
    };
  } catch {
    return { title: "Products · SSV" };
  }
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
          <p className="text-deep/75">Loading products…</p>
        </div>
      }
    >
      <ProductsScreen />
    </Suspense>
  );
}
