import { FREE_DELIVERY_ABOVE } from "@/data/site";

export const MAX_QTY = 10;
export const EXPECTED_DELIVERY_DAYS = 4;

// Placeholder zones until the delivery API is connected. The home prefix is
// the first 3 digits of the dispatch pincode.
const HOME_PINCODE_PREFIX = "600";

export interface DeliveryQuote {
  zone: string;
  fee: number;
  free: boolean;
}

export function deliveryQuote(pincode: string | undefined, subtotal: number): DeliveryQuote {
  let zone = "Rest of India";
  let fee = 110;
  if (pincode && /^\d{6}$/.test(pincode)) {
    if (pincode.startsWith(HOME_PINCODE_PREFIX)) {
      zone = "Local delivery";
      fee = 40;
    } else if (pincode[0] === HOME_PINCODE_PREFIX[0]) {
      zone = "Within your region";
      fee = 70;
    }
  }
  const free = subtotal >= FREE_DELIVERY_ABOVE;
  return { zone, fee: free ? 0 : fee, free };
}

export function expectedDeliveryDate(from: Date | string = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + EXPECTED_DELIVERY_DAYS);
  return date.toISOString();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
