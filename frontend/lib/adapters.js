

export function adaptProduct(raw) {
  if (!raw) return null;
  const variants = (raw.variants || []).map((v, i) => ({
    id: String(v.id || `v-${i}`),
    label: v.label || v.weight_label || v.size_label || `${v.weight_g || 0}g`,
    weight_g: Number(v.weight_g || 0),
    price: Number(v.price || 0),
    available: v.available !== false,
    badge: v.badge || null,
  }));

  // Fallback single variant if none returned
  if (variants.length === 0) {
    variants.push({
      id: "v-default",
      label: "Standard",
      weight_g: 0,
      price: Number(raw.price || 0),
      available: raw.available !== false,
      badge: null,
    });
  }

  return {
    id: String(raw.id),
    name: raw.name || "",
    slug: raw.slug || String(raw.id),
    description: raw.description || "",
    category_id: raw.category_id || "",
    subcategory_id: raw.subcategory_id || null,
    image_url: raw.image_url || `slot:product.${raw.slug || raw.id}.0`,
    badge: raw.badge || null,
    available: raw.available !== false,
    shelf_life_months: Number(raw.shelf_life_months || 12),
    story: raw.story || "",
    ingredients: raw.ingredients || [],
    popularity: Number(raw.popularity || 0),
    variants,
    images: raw.images || [],
    gallery: raw.gallery?.length
      ? raw.gallery
      : raw.images?.length
        ? raw.images
        : [raw.image_url || `slot:product.${raw.slug || raw.id}.0`],
  };
}

export function lowestVariant(product) {
  if (!product?.variants?.length) return { id: "", label: "", price: 0, available: false };
  const avail = product.variants.filter((v) => v.available);
  const list = avail.length > 0 ? avail : product.variants;
  return [...list].sort((a, b) => a.price - b.price)[0];
}

export function availableVariants(product) {
  if (!product?.available) return [];
  return (product.variants || []).filter((v) => v.available);
}

export function isSoldOut(product) {
  return availableVariants(product).length === 0;
}

export function productMeta(product) {
  return `Shelf life ${product.shelf_life_months || 12} months`;
}

export function adaptCategory(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id),
    name: raw.name || "",
    slug: raw.slug || String(raw.id),
    image_url: raw.image_url || `slot:category.${raw.slug}`,
    product_count: raw.product_count != null ? Number(raw.product_count) : 0,
    subcategories: (raw.subcategories || []).map((s) => ({
      id: String(s.id),
      name: s.name || "",
      slug: s.slug || String(s.id),
    })),
  };
}
