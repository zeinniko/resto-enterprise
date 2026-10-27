import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Package } from 'lucide-react';

export default function MenuPackagesIndex({ packages }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    name: '', price: 0, is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/menu-packages', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Paket Combo & Bundling" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Paket Combo & Bundling Menu</h1>
          <p className="text-xs text-slate-500 mt-1">Pengelompokan beberapa menu menjadi satu paket hemat.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Buat Paket Combo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Paket</th>
              <th className="py-3.5 px-4">Harga Paket (Rp)</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {packages?.data?.length > 0 ? (
              packages.data.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Package size={15} className="text-indigo-600" /> {p.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {p.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">Belum ada paket combo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Buat Paket Combo</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Paket *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Paket Hemat 2 Orang" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Harga Bundling (Rp) *</label>
                <input type="number" value={data.price} onChange={(e) => setData('price', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Paket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}