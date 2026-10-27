import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2, X, Save } from 'lucide-react';

interface Props {
  wasteLogs: {
    data: any[];
    total: number;
  };
  branches: any[];
  storageLocations: any[];
  items: any[];
  units: any[];
  filters: { search?: string };
}

export default function WasteLogsIndex({ wasteLogs, branches, storageLocations, items, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    branch_id: '',
    storage_location_id: '',
    item_id: '',
    qty: 1,
    unit_id: '',
    reason: '',
  });

  const handleItemSelect = (itemId: string) => {
    setData('item_id', itemId);
    const selected = items.find(i => i.id === Number(itemId));
    if (selected?.primaryUnit) {
      setData(prev => ({ ...prev, item_id: itemId, unit_id: String(selected.primaryUnit.id) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/waste-logs', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <DashboardLayout>
      <Head title="Pencatatan Waste" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Waste / Kerusakan</h1>
          <p className="text-xs text-slate-500 mt-1">Pencatatan bahan terbuang/kadaluwarsa & pemotongan otomatis stok FEFO.</p>
        </div>
        <button onClick={() => { reset(); setIsModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg shadow-sm">
          <Plus size={16} /> Catat Waste Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tgl Pencatatan</th>
              <th className="py-3.5 px-4">Cabang & Lokasi</th>
              <th className="py-3.5 px-4">Nama Item</th>
              <th className="py-3.5 px-4">Qty Terbuang</th>
              <th className="py-3.5 px-4">Total Kerugian (HPP)</th>
              <th className="py-3.5 px-4">Alasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {wasteLogs.data.length > 0 ? (
              wasteLogs.data.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-500">{new Date(w.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-4 font-semibold">{w.storageLocation?.name} ({w.branch?.name})</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{w.item?.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-600">{w.qty} {w.unit?.symbol}</td>
                  <td className="py-3 px-4 font-mono">Rp {Number(w.total_cost).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-slate-600">{w.reason}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada catatan waste.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Input Waste / Kerusakan Bahan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan *</label>
                <select value={data.storage_location_id} onChange={(e) => setData('storage_location_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Lokasi</option>
                  {storageLocations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item SKU *</label>
                <select value={data.item_id} onChange={(e) => handleItemSelect(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Item SKU</option>
                  {items.map(i => <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Terbuang *</label>
                  <input type="number" step="any" min="0.01" value={data.qty} onChange={(e) => setData('qty', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select value={data.unit_id} onChange={(e) => setData('unit_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="">Satuan</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Kerusakan / Expired *</label>
                <textarea rows={2} value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="misal: Bahan berjamur, expired date lewat..." className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Waste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}