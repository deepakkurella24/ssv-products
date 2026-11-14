import { apiFetch } from "./client";

export const getProducts = (query) => apiFetch("/products/", { query });

export const getProduct = (slug) =>
  apiFetch(`/products/${encodeURIComponent(slug)}`);

export const getRelatedProducts = (slug) =>
  apiFetch(`/products/${encodeURIComponent(slug)}/related`).catch(() => []);

export const getCategories = () => apiFetch("/categories/");

export const getCategory = (slug) =>
  apiFetch(`/categories/${encodeURIComponent(slug)}`);

export const getProductReviews = (productIdOrSlug) =>
  apiFetch(`/products/${encodeURIComponent(productIdOrSlug)}/reviews`).catch(() => []);

export const createProductReview = (productIdOrSlug, body, token) =>
  apiFetch(`/products/${encodeURIComponent(productIdOrSlug)}/reviews`, {
    method: "POST",
    body,
    token,
    auth: true,
  });
