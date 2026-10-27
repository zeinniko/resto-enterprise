import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Store } from 'lucide-react';

export default function BranchItemsIndex({ branchItems, branches, items }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    branch_id: '', item_id: '', custom_price: 0, is_available: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/branch-items', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Setting Item per Cabang" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Setting Item per Cabang</h1>
          <p className="text-xs text-slate-500 mt-1">Kustomisasi ketersediaan barang dan harga khusus per outlet.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Kustomisasi Item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">SKU Item</th>
              <th className="py-3.5 px-4">Harga Khusus</th>
              <th className="py-3.5 px-4">Ketersediaan</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {branchItems?.data?.length > 0 ? (
              branchItems.data.map((bi: any) => (
                <tr key={bi.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{bi.branch?.name}</td>
                  <td className="py-3 px-4 font-mono">{bi.item?.name}</td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {bi.custom_price ? `Rp ${Number(bi.custom_price).toLocaleString('id-ID')}` : 'Harga Standard'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bi.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {bi.is_available ? 'Tersedia' : 'Nonaktif Cabang'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada kustomisasi item cabang.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Setting Item Cabang</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang *</label>
                <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">SKU Item Global *</label>
                <select value={data.item_id} onChange={(e) => setData('item_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Item</option>
                  {items.map((i: any) => <option key={i.id} value={i.id}>[{i.code}] {i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Harga Khusus Cabang (Rp) (Kosongkan jika standar)</label>
                <input type="number" value={data.custom_price} onChange={(e) => setData('custom_price', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}