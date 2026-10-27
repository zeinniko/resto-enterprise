import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Receipt, MonitorPlay, X, Save } from 'lucide-react';

interface Props {
  orders: { data: any[]; total: number };
  branches: any[];
  salesModes: any[];
  tables: any[];
  menuItems: any[];
  filters: { search?: string; status?: string };
}

export default function OrdersIndex({ orders, branches, salesModes, tables, menuItems, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createForm = useForm({
    branch_id: '',
    sales_mode_id: '',
    table_id: '',
    items: [{ menu_item_id: '', qty: 1, unit_price: 0, notes: '' }],
  });

  const handleAddItemRow = () => {
    createForm.setData('items', [...createForm.data.items, { menu_item_id: '', qty: 1, unit_price: 0, notes: '' }]);
  };

  const handleMenuSelect = (index: number, menuId: string) => {
    const updated = [...createForm.data.items];
    updated[index].menu_item_id = menuId;
    const selected = menuItems.find(m => m.id === Number(menuId));
    if (selected) updated[index].unit_price = selected.selling_price;
    createForm.setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/orders', { onSuccess: () => { setIsModalOpen(false); createForm.reset(); } });
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    router.patch(`/orders/${orderId}/status`, { status: newStatus });
  };

  return (
    <DashboardLayout>
      <Head title="Riwayat Transaksi Order POS" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Order POS</h1>
          <p className="text-xs text-slate-500 mt-1">Daftar transaksi pesanan aktif dari mesin kasir front-of-house.</p>
        </div>
        <button onClick={() => { createForm.reset(); setIsModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg shadow-sm">
          <Plus size={16} /> Order POS Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. Order</th>
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">Sales Mode</th>
              <th className="py-3.5 px-4">Meja</th>
              <th className="py-3.5 px-4">Total Bayar</th>
              <th className="py-3.5 px-4">Status Dapur</th>
              <th className="py-3.5 px-4 text-right">Aksi Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {orders.data.length > 0 ? (
              orders.data.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{o.order_number}</td>
                  <td className="py-3 px-4 font-semibold">{o.branch?.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{o.salesMode?.name}</span></td>
                  <td className="py-3 px-4 font-bold">{o.table ? `Meja ${o.table.table_number}` : 'Takeaway'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Rp {Number(o.final_total).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'SERVED' ? 'bg-emerald-50 text-emerald-700' :
                      o.status === 'COOKING' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {o.status === 'PENDING' && <button onClick={() => handleStatusChange(o.id, 'COOKING')} className="px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-200 rounded text-[10px] font-bold">Masak</button>}
                    {o.status === 'COOKING' && <button onClick={() => handleStatusChange(o.id, 'SERVED')} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[10px] font-bold">Sajikan</button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Belum ada order transaksi harian.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Order Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Simulasi POS Order Baru</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Cabang *</label>
                  <select value={createForm.data.branch_id} onChange={(e) => createForm.setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="">Pilih Cabang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Sales Mode *</label>
                  <select value={createForm.data.sales_mode_id} onChange={(e) => createForm.setData('sales_mode_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="">Pilih Mode</option>
                    {salesModes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pilih Meja (Dine-In)</label>
                <select value={createForm.data.table_id} onChange={(e) => createForm.setData('table_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Tanpa Meja (Takeaway / Delivery)</option>
                  {tables.map(t => <option key={t.id} value={t.id}>Meja {t.table_number} ({t.status})</option>)}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold">Item Menu Pesanan *</label><button type="button" onClick={handleAddItemRow} className="text-[11px] font-semibold text-indigo-600">+ Tambah Item</button></div>
                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select value={row.menu_item_id} onChange={(e) => handleMenuSelect(idx, e.target.value)} className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Pilih Menu</option>
                        {menuItems.map(m => <option key={m.id} value={m.id}>{m.name} (Rp {Number(m.selling_price).toLocaleString('id-ID')})</option>)}
                      </select>
                      <input type="number" min="1" placeholder="Qty" value={row.qty} onChange={(e) => {
                        const updated = [...createForm.data.items];
                        updated[idx].qty = parseInt(e.target.value) || 1;
                        createForm.setData('items', updated);
                      }} className="w-16 px-2 py-1.5 text-xs bg-white border rounded font-mono" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={createForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Proses Order POS</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}