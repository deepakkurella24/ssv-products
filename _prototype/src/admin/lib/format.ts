const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,24,500 */
export function formatINR(amount: number) {
  return `₹${inr.format(Math.round(amount))}`;
}

/** ₹12.4k style for chart axes. */
export function formatINRCompact(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount >= 1000000 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(amount)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 9 Nov */
export function formatDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 4:30 pm */
export function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}`;
}

/** 9 Nov, 4:30 pm */
export function formatDateTime(iso: string) {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/** +91 98765 43210 */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(-10);
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export const telHref = (digits: string) => `tel:+91${digits.replace(/\D/g, "").slice(-10)}`;
export const whatsappHref = (digits: string, text?: string) =>
  `https://wa.me/91${digits.replace(/\D/g, "").slice(-10)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** 5 min ago, 3 h ago, 2 d ago, then the date. */
export function timeAgo(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return formatDay(iso);
}

export function formatAddress(a: {
  door_no: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}) {
  return `${a.door_no}, ${a.street}, ${a.city}, ${a.state} ${a.pincode}`;
}

/** yyyy-mm-dd in local time, for <input type="date">. */
export function toDateInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local date from yyyy-mm-dd at the given hour. */
export function fromDateInput(value: string, hour = 18, minute = 0) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute).toISOString();
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
