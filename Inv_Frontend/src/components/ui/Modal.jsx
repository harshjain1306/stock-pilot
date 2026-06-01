import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`card w-full ${sizes[size]} max-h-[90vh] flex flex-col shadow-xl animate-in`}
        style={{ animation: "modalIn 0.15s ease-out" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1 -mr-1 rounded-md">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}