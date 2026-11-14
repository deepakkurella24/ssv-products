export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const rupee = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPrice(amount) {
  return `₹${rupee.format(amount || 0)}`;
}

export function initials(name) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
