import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { DollarSign, ShoppingCart, ShoppingBag, Clock } from 'lucide-react';

interface Props {
  metrics: {
    totalSales: number;
    totalOrders: number;
    pendingPOs: number;
    activeShifts: number;
  };
  recentOrders: any[];
}

export default function Dashboard({ metrics, recentOrders }: Props) {
  return (
    <DashboardLayout>
      <Head title="Dashboard Analytics" />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Ringkasan performa penjualan, pengadaan, dan register shift kasir.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Penjualan</p>
            <p className="text-lg font-bold font-mono text-slate-900">Rp {Number(metrics.totalSales).toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Transaksi</p>
            <p className="text-lg font-bold font-mono text-slate-900">{metrics.totalOrders} Order</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending PO</p>
            <p className="text-lg font-bold font-mono text-slate-900">{metrics.pendingPOs} PO</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Shift Kasir Aktif</p>
            <p className="text-lg font-bold font-mono text-slate-900">{metrics.activeShifts} Register</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Transaksi Terbaru POS</h2>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3 px-4">No. Order</th>
              <th className="py-3 px-4">Cabang</th>
              <th className="py-3 px-4">Sales Mode</th>
              <th className="py-3 px-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {recentOrders.length > 0 ? (
              recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{o.order_number}</td>
                  <td className="py-3 px-4">{o.branch?.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{o.salesMode?.name}</span></td>
                  <td className="py-3 px-4 font-mono font-bold">Rp {Number(o.final_total).toLocaleString('id-ID')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">Belum ada transaksi harian.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}