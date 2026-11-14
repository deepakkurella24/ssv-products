const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export function formatINR(amount) {
  const num = Number(amount) || 0;
  return `\u20B9${inr.format(Math.round(num))}`;
}
export function formatINRCompact(amount) {
  const num = Number(amount) || 0;
  if (num >= 1e5) return `\u20B9${(num / 1e5).toFixed(num >= 1e6 ? 0 : 1)}L`;
  if (num >= 1e3) return `\u20B9${(num / 1e3).toFixed(num >= 1e4 ? 0 : 1)}k`;
  return `\u20B9${Math.round(num)}`;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDay(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}`;
}
export function formatDateTime(iso) {
  if (!iso) return "—";
  const day = formatDay(iso);
  if (day === "—") return "—";
  return `${day}, ${formatTime(iso)}`;
}
export function formatPhone(digits) {
  const d = digits.replace(/\D/g, "").slice(-10);
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
export const telHref = (digits) => `tel:+91${digits.replace(/\D/g, "").slice(-10)}`;
export const whatsappHref = (digits, text) => `https://wa.me/91${digits.replace(/\D/g, "").slice(-10)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export function timeAgo(iso, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 6e4);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return formatDay(iso);
}
export function formatAddress(a) {
  return `${a.door_no}, ${a.street}, ${a.city}, ${a.state} ${a.pincode}`;
}
export function toDateInput(iso) {
  const d = new Date(iso);
  const p = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function fromDateInput(value, hour = 18, minute = 0) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute).toISOString();
}
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
