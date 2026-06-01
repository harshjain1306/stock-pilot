import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ skip, limit, total, onPageChange }) {
  const page = Math.floor(skip / limit);
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button
          className="btn-ghost px-2 py-1 text-xs"
          onClick={() => onPageChange((page - 1) * limit)}
          disabled={page === 0}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const pg = i;
          return (
            <button
              key={pg}
              onClick={() => onPageChange(pg * limit)}
              className={`btn text-xs px-2.5 py-1 ${pg === page ? "bg-brand-600 text-white border-brand-600" : "btn-ghost"}`}
            >
              {pg + 1}
            </button>
          );
        })}
        <button
          className="btn-ghost px-2 py-1 text-xs"
          onClick={() => onPageChange((page + 1) * limit)}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}