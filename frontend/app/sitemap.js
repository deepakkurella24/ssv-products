import { getCategories, getProducts } from "@/lib/api/public";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const routes = [
    "",
    "/products",
    "/why-ssv",
    "/events",
    "/contact",
    "/custom-order",
    "/sign-in",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);
    const productList = Array.isArray(products) ? products : products?.products || [];
    const categoryList = Array.isArray(categories)
      ? categories
      : categories?.categories || [];
    for (const product of productList) {
      if (product?.slug) {
        routes.push({
          url: `${base}/products/${encodeURIComponent(product.slug)}`,
          lastModified: new Date(),
        });
      }
    }
    for (const category of categoryList) {
      if (category?.slug) {
        routes.push({
          url: `${base}/products?category=${encodeURIComponent(category.slug)}`,
          lastModified: new Date(),
        });
      }
    }
  } catch {}
  return routes;
}
