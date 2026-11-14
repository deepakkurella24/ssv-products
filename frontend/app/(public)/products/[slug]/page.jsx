import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductLoadError from "@/components/product/ProductLoadError";
import { getProduct, getRelatedProducts } from "@/lib/api/public";
import { adaptProduct } from "@/lib/adapters";
import { imageUrl } from "@/lib/images";
async function product(slug) {
  try {
    return { item: await getProduct(slug) };
  } catch (error) {
    return { error };
  }
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await product(slug);
  const item = result.item;
  if (!item)
    return {
      title:
        result.error?.status === 404 ? "Product not found" : "Product · SSV",
    };
  return {
    title: item.name,
    description: item.description,
    openGraph: { images: item.image_url ? [imageUrl(item.image_url)] : [] },
  };
}
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const result = await product(slug);
  if (result.error?.status === 404) notFound();
  if (result.error) return <ProductLoadError message={result.error.message} />;
  const item = adaptProduct(result.item);
  let related = [];
  try {
    related = await getRelatedProducts(slug);
  } catch {}
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    image: item.image_url ? imageUrl(item.image_url) : undefined,
    sku: item.id,
    offers: (item.variants || [])
      .filter((v) => v.available)
      .map((v) => ({
        "@type": "Offer",
        priceCurrency: "INR",
        price: v.price,
        availability: "https://schema.org/InStock",
      })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail product={item} related={related} />
    </>
  );
}
