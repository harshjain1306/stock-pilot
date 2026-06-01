const STATUS_STYLES = {
  pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped:   "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`badge font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}