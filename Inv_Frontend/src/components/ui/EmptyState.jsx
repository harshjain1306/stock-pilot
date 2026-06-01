import { PackageOpen } from "lucide-react";

export default function EmptyState({ title = "No results", description = "Nothing to show here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <PackageOpen size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
  );
}