import { apiFetch } from "./client";

const call = (path, options = {}) => apiFetch(path, { ...options, auth: true });

// Orders
export const adminGetOrders = (status, token) =>
  call("/admin/order", { query: status && status !== "all" ? { status } : undefined, token });

export const adminGetOrder = (id, token) =>
  call(`/admin/order/${id}`, { token });

export const adminUpdateOrder = (id, body, token) =>
  call(`/admin/order/${id}`, { method: "PATCH", body, token });

export const adminGetCounts = (token) =>
  call("/admin/counts", { token }).catch(() => ({ pendingOrders: 0, newRequests: 0 }));

// Custom Requests
export const adminGetCustomRequests = (status, token) =>
  call("/admin/custom-requests", { query: status && status !== "all" ? { status } : undefined, token });

export const adminGetCustomRequest = (id, token) =>
  call(`/admin/custom-requests/${id}`, { token });

export const adminUpdateCustomRequest = (id, body, token) =>
  call(`/admin/custom-requests/${id}`, { method: "PATCH", body, token });

export const adminConfirmCustomRequest = (id, body, token) =>
  call(`/admin/custom-requests/${id}/confirm`, { method: "POST", body, token });

export const adminGetRequestAddresses = (id, token) =>
  call(`/admin/custom-requests/${id}/addresses`, { token });

export const adminAddRequestAddress = (id, body, token) =>
  call(`/admin/custom-requests/${id}/addresses`, {
    method: "POST",
    body,
    token,
  });

// Products
export const adminGetProducts = (query, token) =>
  call("/admin/products", { query, token }).then((res) => res?.products || res || []);

export const adminGetProduct = (id, token) =>
  call(`/admin/products/${id}`, { token });

export const adminCreateProduct = (body, token) =>
  call("/admin/products", { method: "POST", body, token });

export const adminUpdateProduct = (id, body, token) =>
  call(`/admin/products/${id}`, { method: "PATCH", body, token });

export const adminDeleteProduct = (id, token) =>
  call(`/admin/products/${id}`, { method: "DELETE", token });

// Categories
export const adminGetCategories = (token) =>
  call("/admin/categories", { token });

export const adminCreateCategory = (body, token) =>
  call("/admin/categories", { method: "POST", body, token });

export const adminUpdateCategory = (id, body, token) =>
  call(`/admin/categories/${id}`, { method: "PATCH", body, token });

export const adminDeleteCategory = (id, token) =>
  call(`/admin/categories/${id}`, { method: "DELETE", token });

export const adminReorderCategories = (parentId, orderedIds, token) =>
  call("/admin/categories/reorder", {
    method: "PATCH",
    body: { parent_id: parentId, ordered_ids: orderedIds },
    token,
  });

// Coupons
export const adminListCoupons = (token) =>
  call("/admin/coupons", { token });

export const adminGetCoupon = (id, token) =>
  call(`/admin/coupons/${id}`, { token });

export const adminCreateCoupon = (body, token) =>
  call("/admin/coupons", { method: "POST", body, token });

export const adminUpdateCoupon = (id, body, token) =>
  call(`/admin/coupons/${id}`, { method: "PATCH", body, token });

export const adminToggleCoupon = (id, active, token) =>
  call(`/admin/coupons/${id}/toggle`, { method: "PATCH", body: { active }, token });

export const adminDeleteCoupon = (id, token) =>
  call(`/admin/coupons/${id}`, { method: "DELETE", token });
