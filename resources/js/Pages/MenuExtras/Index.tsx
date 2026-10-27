import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, PlusCircle } from 'lucide-react';

export default function MenuExtrasIndex({ extras }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    name: '', price: 0, is_available: true,
  });

  const handleOpenModal = (item: any = null) => {
    setEditingExtra(item);
    if (item) {
      setData({ name: item.name, price: item.price, is_available: item.is_available });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExtra) {
      put(`/menu-extras/${editingExtra.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/menu-extras', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Menu Extras & Topping" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Menu Extras & Modifiers</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola opsional topping, add-on, dan modifier item makanan/minuman.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Topping
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Extra / Topping</th>
              <th className="py-3.5 px-4">Harga Tambahan (Rp)</th>
              <th className="py-3.5 px-4">Ketersediaan</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {extras?.data?.length > 0 ? (
              extras.data.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <PlusCircle size={15} className="text-emerald-600" /> {ex.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">Rp {Number(ex.price).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ex.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {ex.is_available ? 'Tersedia' : 'Habis'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(ex)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                    <button onClick={() => confirm('Hapus topping?') && router.delete(`/menu-extras/${ex.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada data menu extra.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Menu Extra</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Extra / Topping *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Extra Keju Mozzarella" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Harga Tambahan (Rp) *</label>
                <input type="number" value={data.price} onChange={(e) => setData('price', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
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