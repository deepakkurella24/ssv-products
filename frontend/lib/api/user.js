import { apiFetch } from "./client";

const call = (path, options = {}) => apiFetch(path, { ...options, auth: true });

// Identity
export const getMe = (token) => call("/me", { token });

// Cart
export const getCart = (token) => call("/cart/", { token });

export const addCartItem = (body, token) =>
  call("/cart/items", { method: "POST", body, token });

export const updateCartItem = (id, body, token) =>
  call(`/cart/items/${id}`, { method: "PATCH", body, token });

export const removeCartItem = (id, token) =>
  call(`/cart/items/${id}`, { method: "DELETE", token });

// Saved Addresses
export const getAddresses = (token) =>
  call("/addresses/", { token }).then((res) => (Array.isArray(res) ? res : res?.addresses || []));

export const addAddress = (body, token) =>
  call("/addresses/", { method: "POST", body, token });

export const updateAddress = (id, body, token) =>
  call(`/addresses/${id}`, { method: "PATCH", body, token });

export const setDefaultAddress = (id, token) =>
  call(`/addresses/${id}/default`, { method: "PATCH", token });

export const deleteAddress = (id, token) =>
  call(`/addresses/${id}`, { method: "DELETE", token });

// Orders
export const createOrder = (body, token) =>
  call("/order/", { method: "POST", body, token });

export const getOrders = (token) =>
  call("/order/", { token }).then((res) => (Array.isArray(res) ? res : res?.orders || []));

export const getOrder = (id, token) =>
  call(`/order/${id}`, { token });

export const cancelOrder = (id, token) =>
  call(`/order/${id}/cancel`, { method: "PATCH", token });

// Custom Requests
export const createCustomRequest = (body, token) =>
  call("/custom-requests/", { method: "POST", body, token });

export const getMyCustomRequests = (token) =>
  call("/custom-requests/me", { token }).then((res) => (Array.isArray(res) ? res : res?.custom_requests || []));
