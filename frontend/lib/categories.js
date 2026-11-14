export function categoryHref(slug, subSlug) {
  if (!slug) return "/products";
  const params = new URLSearchParams({ category: slug });
  if (subSlug) params.set("sub", subSlug);
  return `/products?${params.toString()}`;
}

export function findCategory(idOrSlug, categories = []) {
  if (!idOrSlug) return undefined;
  return categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
