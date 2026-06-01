import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/customers";
import { formatDate } from "../utils/formatters";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Plus, Search, Pencil, Trash2, Mail, Phone } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

function CustomerForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          <input className="input" {...register("name")} placeholder="Alice Johnson" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input" type="email" {...register("email")} placeholder="alice@example.com" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" {...register("phone")} placeholder="9876543210" />
      </div>
      <div>
        <label className="label">Address</label>
        <textarea className="input" rows={2} {...register("address")} placeholder="123 Main St, City…" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner size={14} className="text-white" /> : null}
          {defaultValues ? "Save Changes" : "Create Customer"}
        </button>
      </div>
    </form>
  );
}

const LIMIT = 10;

export default function Customers() {
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
      if (search) params.name = search;
      const res = await getCustomers(params);
      setData(res.data);
    } catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  }, [skip, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (values) => {
    setActionLoading(true);
    try {
      await createCustomer(values);
      toast.success("Customer created");
      setAddOpen(false);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async (values) => {
    setActionLoading(true);
    try {
      await updateCustomer(editItem.id, values);
      toast.success("Customer updated");
      setEditItem(null);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteCustomer(deleteItem.id);
      toast.success("Customer deleted");
      setDeleteItem(null);
      fetchData();
    } catch (e) { toast.error(e.userMessage || "Error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data.total} total customers</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-8 text-sm" placeholder="Search by name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        ) : data.data.length === 0 ? (
          <EmptyState title="No customers found" description="Add your first customer to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Address</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-slate-600"><Mail size={11} className="text-slate-400" />{c.email}</span>
                      {c.phone && <span className="flex items-center gap-1 text-slate-500 text-xs"><Phone size={11} className="text-slate-400" />{c.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{c.address || "—"}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => setEditItem(c)}><Pencil size={14} /></button>
                      <button className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteItem(c)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination skip={skip} limit={LIMIT} total={data.total} onPageChange={setSkip} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <CustomerForm onSubmit={handleCreate} loading={actionLoading} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Customer">
        {editItem && <CustomerForm defaultValues={editItem} onSubmit={handleEdit} loading={actionLoading} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Customer"
        message={`Delete "${deleteItem?.name}"? This cannot be undone.`}
      />
    </div>
  );
}