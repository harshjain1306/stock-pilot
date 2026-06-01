export const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(val) || 0);

export const formatDate = (iso) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
};

export const truncate = (str, n = 30) =>
  str && str.length > n ? str.slice(0, n) + "…" : str || "—";
