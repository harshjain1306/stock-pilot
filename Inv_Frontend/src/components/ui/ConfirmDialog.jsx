import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertTriangle size={16} className={danger ? "text-red-600" : "text-amber-600"} />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={danger ? "btn-danger" : "btn-primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}