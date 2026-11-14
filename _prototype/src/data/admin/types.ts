// Admin data models. Shapes mirror what a real admin API would return.

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online";

/** Used for analytics and reporting only. Zones never add a delivery fee. */
export type DeliveryZone = "same_city" | "same_state" | "nearby_states" | "other_states";

export interface AdminAddress {
  id: string;
  name: string;
  phone: string;
  door_no: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface AdminOrderItem {
  id: string;
  product_id: string | null;
  name: string;
  variant_label: string;
  image_url: string;
  qty: number;
  /** Snapshot of the unit price when the order was placed (includes delivery). */
  price: number;
  /** Custom-order items only. */
  weight_kg?: number;
  customisation?: string;
}

export interface StatusEvent<S extends string> {
  status: S;
  at: string;
}

export interface AdminOrder {
  /** Order number as a string, e.g. "1042". Used in URLs. */
  id: string;
  number: number;
  placed_at: string;
  status: OrderStatus;
  status_history: StatusEvent<OrderStatus>[];
  customer: AdminCustomer;
  address: AdminAddress;
  items: AdminOrderItem[];
  /** Sum of item prices. Prices already include delivery, so this is the payable total. */
  total: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  expected_delivery: string;
  delivered_at: string | null;
  delivery_zone: DeliveryZone;
  source_request_id: string | null;
}

export type RequestStatus = "new" | "contacted" | "confirmed" | "closed";

export interface AdminCustomRequest {
  id: string;
  product_name: string;
  quantity_kg: number;
  customisation: string;
  customer: AdminCustomer;
  addresses: AdminAddress[];
  received_at: string;
  status: RequestStatus;
  status_history: StatusEvent<RequestStatus>[];
  /** Private. Never shown to customers. */
  admin_notes: string;
  order_id: string | null;
}

export type AdminSpiceLevel = "none" | "mild" | "medium" | "hot";

export interface AdminVariant {
  id: string;
  label: string;
  weight_g: number;
  /** Final customer price, delivery included. */
  price: number;
  badge: string | null;
  available: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  image_url: string;
  category_id: string;
  subcategory_id: string | null;
  badge: string | null;
  spice_level: AdminSpiceLevel;
  shelf_life_months: number;
  ingredients: string[];
  available: boolean;
  variants: AdminVariant[];
  created_at: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  /** Null for top-level categories. Subcategories cannot have children. */
  parent_id: string | null;
}

export type { Coupon, CouponType } from "./coupons";
