import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { formatCurrency, formatDate } from "../utils/formatters";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required").regex(/^[a-zA-Z0-9-]+$/, "Only alphanumeric and hyphens"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Must be > 0"),
  stock_quantity: z.coerce.number().int().min(0, "Must be ≥ 0"),
});

function ProductForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          <input className="input" {...register("name")} placeholder="Laptop Pro 15" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">SKU *</label>
          <input className="input font-mono" {...register("sku")} placeholder="LAP-001" />
          {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} {...register("description")} placeholder="Optional description…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price *</label>
          <input className="input" type="number" step="0.01" {...register("price")} placeholder="0.00" />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="label">Stock Quantity *</label>
          <input className="input" type="number" {...register("stock_quantity")} placeholder="0" />
          {errors.stock_quantity && <p className="text-xs text-red-500 mt-1">{errors.stock_quantity.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner size={14} className="text-white" /> : null}
          {defaultValues ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

const LIMIT = 10;

export default function Products() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { skip, limit: LIMIT };
      if (search) { params.name = search; }
      const res = await getProducts(params);
      setData(res.data);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, [skip, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => { setSearch(e.target.value); setSkip(0); };

  const handleCreate = async (values) => {
    setActionLoading(true);
    try {
      await createProduct(values);
      toast.success("Product created");
      setAddOpen(false);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async (values) => {
    setActionLoading(true);
    try {
      await updateProduct(editItem.id, values);
      toast.success("Product updated");
      setEditItem(null);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteProduct(deleteItem.id);
      toast.success("Product deleted");
      setDeleteItem(null);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data.total} total products</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-8 text-sm" placeholder="Search by name or SKU…" value={search} onChange={handleSearch} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState title="No products found" description="Add your first product to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.sku}</code>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stock_quantity <= 10 ? "text-red-600" : "text-slate-800"}`}>
                      {p.stock_quantity}
                    </span>
                    {p.stock_quantity <= 10 && (
                      <AlertTriangle size={12} className="inline ml-1 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => setEditItem(p)}><Pencil size={14} /></button>
                      <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteItem(p)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination skip={skip} limit={LIMIT} total={data.total} onPageChange={setSkip} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Product">
        <ProductForm onSubmit={handleCreate} loading={actionLoading} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Product">
        {editItem && <ProductForm defaultValues={editItem} onSubmit={handleEdit} loading={actionLoading} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
      />
    </div>
  );
}