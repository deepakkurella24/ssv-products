import { expectedDeliveryDate } from "@/lib/delivery";
import type { Address, CustomRequest, Order } from "./types";

// Sample account data for the preview. Replace with the accounts API.

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const SEED_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    name: "Priya Sharma",
    phone: "9876543210",
    door_no: "12/4",
    street: "Temple Street, Gandhi Nagar",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
    is_default: true,
  },
];

const sample = SEED_ADDRESSES[0];

export const SEED_ORDERS: Order[] = [
  {
    id: "SSV-10268",
    placed_at: daysAgo(2),
    status: "out_for_delivery",
    items: [
      {
        product_id: "p-sesame-oil",
        name: "Cold Pressed Sesame Oil",
        variant_label: "1 L",
        price: 640,
        qty: 1,
      },
      {
        product_id: "p-turmeric-powder",
        name: "Turmeric Powder",
        variant_label: "200 g",
        price: 110,
        qty: 2,
      },
    ],
    subtotal: 860,
    delivery_fee: 70,
    total: 930,
    payment_method: "cod",
    amount_paid: 0,
    address: sample,
    expected_delivery: expectedDeliveryDate(daysAgo(2)),
  },
  {
    id: "SSV-10244",
    placed_at: daysAgo(6),
    status: "cancelled",
    items: [
      {
        product_id: "p-black-sesame-oil",
        name: "Black Sesame Oil",
        variant_label: "500 ml",
        price: 420,
        qty: 1,
      },
    ],
    subtotal: 420,
    delivery_fee: 70,
    total: 490,
    payment_method: "online",
    amount_paid: 0,
    address: sample,
    expected_delivery: expectedDeliveryDate(daysAgo(6)),
  },
  {
    id: "SSV-10231",
    placed_at: daysAgo(16),
    status: "delivered",
    items: [
      {
        product_id: "p-forest-honey",
        name: "Forest Honey",
        variant_label: "500 g",
        price: 520,
        qty: 2,
      },
      {
        product_id: "p-dhoop-sticks",
        name: "Dhoop Sticks",
        variant_label: "100 g",
        price: 90,
        qty: 1,
      },
    ],
    subtotal: 1130,
    delivery_fee: 0,
    total: 1130,
    payment_method: "online",
    amount_paid: 1130,
    address: sample,
    expected_delivery: expectedDeliveryDate(daysAgo(16)),
  },
];

export const SEED_REQUESTS: CustomRequest[] = [
  {
    id: "REQ-2041",
    item: "Cold pressed sesame oil, for a temple kitchen",
    quantity_kg: 25,
    details: "Need it in 5 L cans. Delivery before the festival week.",
    mobile: "9876543210",
    status: "contacted",
    created_at: daysAgo(3),
  },
  {
    id: "REQ-2017",
    item: "Forest honey",
    quantity_kg: 5,
    details: "",
    mobile: "9876543210",
    status: "closed",
    created_at: daysAgo(30),
  },
];
