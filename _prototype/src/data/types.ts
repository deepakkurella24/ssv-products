// Shapes mirror the planned backend API so mock data can be swapped for real calls.

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  subcategories: Subcategory[];
}

export interface Variant {
  id: string;
  label: string;
  weight_g: number;
  price: number;
  available: boolean;
  badge: string | null;
}

export type ProductBadge = "New" | "Bestseller" | null;
export type SpiceLevel = "mild" | "medium" | "hot" | null;

export interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  badge: ProductBadge;
  spice_level: SpiceLevel;
  shelf_life_months: number;
  available: boolean;
  category_id: string;
  subcategory_id: string;
  variants: Variant[];
  /** Detail page: gallery photos, main photo first. */
  gallery: string[];
  description: string;
  story: string;
  ingredients: string[];
  /** Higher sells better; used for the "Best selling" sort. */
  popularity: number;
}

export interface User {
  name: string;
  email: string;
}

export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  door_no: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online";

export interface OrderItem {
  product_id: string;
  name: string;
  variant_label: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  placed_at: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  address: Address;
  expected_delivery: string;
}

export type CustomRequestStatus = "received" | "contacted" | "confirmed" | "closed";

// Admin notes are never part of this shape, so they can never be shown to customers.
export interface CustomRequest {
  id: string;
  item: string;
  quantity_kg: number;
  details: string;
  mobile: string;
  status: CustomRequestStatus;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  order_id?: string;
  user_name: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  created_at: string;
  verified_buyer: boolean;
  variant_label?: string;
}
