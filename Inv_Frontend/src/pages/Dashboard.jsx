import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { getCustomers } from "../api/customers";
import { getOrders } from "../api/orders";
import { getLowStock } from "../api/inventory";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import StatusBadge from "../components/ui/StatusBadge";
import Spinner from "../components/ui/Spinner";
import {
  Package, Users, ShoppingCart, AlertTriangle,
  TrendingUp, Clock
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color = "brand" }) {
  const colors = {
    brand:  "bg-brand-50 text-brand-600",
    green:  "bg-green-50 text-green-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_ORDER = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ products: 0, customers: 0, orders: [], lowStock: 0 });

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 1 }),
      getCustomers({ limit: 1 }),
      getOrders({ limit: 5 }),
      getLowStock({ limit: 100 }),
    ]).then(([p, c, o, ls]) => {
      setData({
        products: p.data.total,
        customers: c.data.total,
        orders: o.data.data,
        totalOrders: o.data.total,
        lowStock: ls.data.total,
      });
    }).finally(() => setLoading(false));
  }, []);

  const statusCounts = data.orders?.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {}) || {};

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={28} />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your inventory & orders</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Total Products" value={data.products} color="brand" />
        <StatCard icon={Users} label="Customers" value={data.customers} color="green" />
        <StatCard icon={ShoppingCart} label="Orders" value={data.totalOrders} color="brand" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={data.lowStock} color="red" sub="items need restocking" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Orders</h2>
            </div>
          </div>
          {data.orders?.length === 0 ? (
            <p className="text-sm text-slate-400 p-5">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Customer</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">Total</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{o.customer_name}</td>
                    <td className="px-3 py-3 text-slate-700">{formatCurrency(o.total_amount)}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right text-slate-400 text-xs">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <TrendingUp size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Order Statuses</h2>
          </div>
          <div className="p-5 space-y-3">
            {STATUS_ORDER.map((s) => {
              const count = statusCounts[s] || 0;
              const pct = data.orders?.length ? Math.round((count / data.orders.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 capitalize">{s}</span>
                    <span className="text-xs font-medium text-slate-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}