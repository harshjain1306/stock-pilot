import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getInventory, getLowStock, adjustStock } from "../api/inventory";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { AlertTriangle, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react";

function AdjustModal({ item, open, onClose, onAdjusted }) {
  const [type, setType] = useState("add");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!qty || qty <= 0) return toast.error("Enter a valid quantity");
    setLoading(true);
    try {
      await adjustStock(item.id, { adjustment_type: type, quantity: parseInt(qty), reason: reason || undefined });
      toast.success("Stock updated");
      onAdjusted();
      onClose();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setLoading(false); }
  };

  const preview = () => {
    const q = parseInt(qty) || 0;
    const cur = item?.stock_quantity || 0;
    if (type === "add") return cur + q;
    if (type === "subtract") return Math.max(0, cur - q);
    return q;
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust Stock" size="sm">
      {item && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-0.5">Product</p>
            <p className="font-medium text-slate-800">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-slate-500">{item.sku}</code>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600">Current stock: <strong>{item.stock_quantity}</strong></span>
            </div>
          </div>

          <div>
            <label className="label">Adjustment Type</label>
            <div className="flex gap-2">
              {[["add", "Add", TrendingUp], ["subtract", "Subtract", TrendingDown], ["set", "Set to", SlidersHorizontal]].map(([val, label, Icon]) => (
                <button key={val} onClick={() => setType(val)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                    type === val ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Quantity</label>
            <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </div>

          <div>
            <label className="label">Reason (optional)</label>
            <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. New stock received…" />
          </div>

          <div className="bg-brand-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-brand-700">New stock count</span>
            <span className="font-bold text-brand-800 text-lg">{preview()}</span>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <Spinner size={14} className="text-white" /> : null}
              Update Stock
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const LIMIT = 10;

export default function Inventory() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [tab, setTab] = useState("all");
  const [adjustItem, setAdjustItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip, limit: LIMIT };
      const fn = tab === "low" ? getLowStock : getInventory;
      const res = await fn(params);
      setData(res.data);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  }, [skip, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage stock levels across all products</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-1">
          {[["all", "All Products"], ["low", "Low Stock"]].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setSkip(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}>
              {label}
              {key === "low" && tab === "low" && data.total > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-px">{data.total}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState title={tab === "low" ? "No low stock items" : "No inventory found"} description="All products are well stocked." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Last Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      {p.is_low_stock && (
                        <span className="badge bg-red-50 text-red-600 border border-red-200 gap-1">
                          <AlertTriangle size={10} />Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.sku}</code>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.is_low_stock ? "bg-red-400" : "bg-green-400"}`}
                          style={{ width: `${Math.min(100, (p.stock_quantity / 200) * 100)}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${p.is_low_stock ? "text-red-600" : "text-slate-800"}`}>
                        {p.stock_quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{formatDateTime(p.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary text-xs px-2.5 py-1.5 gap-1.5" onClick={() => setAdjustItem(p)}>
                      <SlidersHorizontal size={12} /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination skip={skip} limit={LIMIT} total={data.total} onPageChange={setSkip} />
      </div>

      <AdjustModal
        item={adjustItem}
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        onAdjusted={fetchData}
      />
    </div>
  );
}