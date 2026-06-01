import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getOrders, createOrder, updateOrderStatus, deleteOrder } from "../api/orders";
import { getCustomers } from "../api/customers";
import { getProducts } from "../api/products";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { Plus, Search, Eye, Trash2, ChevronDown, X } from "lucide-react";

const STATUS_TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

const LIMIT = 10;

function CreateOrderModal({ open, onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      getCustomers({ limit: 200 }),
      getProducts({ limit: 200 }),
    ]).then(([c, p]) => {
      setCustomers(c.data.data);
      setProducts(p.data.data);
    }).finally(() => setLoadingData(false));
    setCustomerId(""); setItems([{ product_id: "", quantity: 1 }]); setNotes("");
  }, [open]);

  const addItem = () => setItems([...items, { product_id: "", quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const setItem = (i, field, val) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const total = items.reduce((sum, it) => {
    const p = products.find(p => p.id === it.product_id);
    return sum + (p ? Number(p.price) * (parseInt(it.quantity) || 0) : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!customerId) return toast.error("Select a customer");
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (!validItems.length) return toast.error("Add at least one item");
    setLoading(true);
    try {
      await createOrder({ customer_id: customerId, items: validItems.map(i => ({ product_id: i.product_id, quantity: parseInt(i.quantity) })), notes: notes || undefined });
      toast.success("Order created");
      onCreated();
      onClose();
    } catch (e) {
      const errs = e.response?.data?.details?.stock_errors;
      toast.error(errs ? errs[0] : (e.userMessage || "Error"));
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Order" size="lg">
      {loadingData ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <div className="space-y-4">
          <div>
            <label className="label">Customer *</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <button className="btn-ghost text-xs px-2 py-1" onClick={addItem}><Plus size={13} /> Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => {
                const prod = products.find(p => p.id === item.product_id);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select className="input flex-1" value={item.product_id} onChange={e => setItem(i, "product_id", e.target.value)}>
                      <option value="">Select product…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {formatCurrency(p.price)} — stock: {p.stock_quantity}</option>)}
                    </select>
                    <input className="input w-20 text-center" type="number" min="1" value={item.quantity}
                      onChange={e => setItem(i, "quantity", e.target.value)} />
                    {prod && (
                      <span className="text-xs text-slate-500 min-w-16 text-right">
                        {formatCurrency(Number(prod.price) * (parseInt(item.quantity) || 0))}
                      </span>
                    )}
                    {items.length > 1 && (
                      <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><X size={14} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Total: {formatCurrency(total)}</p>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <Spinner size={14} className="text-white" /> : null}
              Place Order
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <Modal open={!!order} onClose={onClose} title={`Order #${order.id.slice(0, 8).toUpperCase()}`} size="lg">
      <div className="space-y-4">
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Customer</p>
            <p className="font-medium text-slate-800">{order.customer_name}</p>
            <p className="text-xs text-slate-500">{order.customer_email}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500 mb-0.5">Status</p>
            <StatusBadge status={order.status} />
          </div>
        </div>
        {order.notes && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <span className="font-medium">Note:</span> {order.notes}
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 text-xs font-medium text-slate-500">Product</th>
              <th className="text-right py-2 text-xs font-medium text-slate-500">Unit Price</th>
              <th className="text-right py-2 text-xs font-medium text-slate-500">Qty</th>
              <th className="text-right py-2 text-xs font-medium text-slate-500">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map(it => (
              <tr key={it.id} className="border-b border-slate-50">
                <td className="py-2.5">
                  <p className="font-medium text-slate-800">{it.product_name}</p>
                  <code className="text-xs text-slate-400">{it.product_sku}</code>
                </td>
                <td className="py-2.5 text-right text-slate-600">{formatCurrency(it.unit_price)}</td>
                <td className="py-2.5 text-right text-slate-600">{it.quantity}</td>
                <td className="py-2.5 text-right font-medium text-slate-800">{formatCurrency(Number(it.unit_price) * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-slate-700">Total</td>
              <td className="pt-3 text-right text-base font-bold text-slate-900">{formatCurrency(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-slate-400 text-right">Placed {formatDateTime(order.created_at)}</p>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await getOrders(params);
      setData(res.data);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [skip, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Order ${newStatus}`);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteOrder(deleteItem.id);
      toast.success("Order cancelled");
      setDeleteItem(null);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data.total} total orders</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> New Order
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-8 text-sm" placeholder="Search orders…" value={search} onChange={e => { setSearch(e.target.value); setSkip(0); }} />
          </div>
          <select className="input w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSkip(0); }}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState title="No orders found" description="Create your first order to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Items</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((o) => {
                const nextStatuses = STATUS_TRANSITIONS[o.status] || [];
                return (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{o.customer_name}</p>
                      <p className="text-xs text-slate-400">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{o.items?.length || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(o.total_amount)}</td>
                    <td className="px-4 py-3">
                      {nextStatuses.length > 0 ? (
                        <div className="relative group inline-block">
                          <button className="flex items-center gap-1 hover:opacity-80">
                            <StatusBadge status={o.status} />
                            <ChevronDown size={11} className="text-slate-400" />
                          </button>
                          <div className="hidden group-hover:block absolute left-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-32">
                            {nextStatuses.map(s => (
                              <button key={s} onClick={() => handleStatusChange(o, s)}
                                className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 capitalize">
                                → {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : <StatusBadge status={o.status} />}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">{formatDateTime(o.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setViewOrder(o)}><Eye size={14} /></button>
                        {["pending", "confirmed"].includes(o.status) && (
                          <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteItem(o)}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination skip={skip} limit={LIMIT} total={data.total} onPageChange={setSkip} />
      </div>

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchData} />
      <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Cancel Order"
        message={`Cancel order #${deleteItem?.id?.slice(0, 8).toUpperCase()}? Stock will be restored.`}
      />
    </div>
  );
}