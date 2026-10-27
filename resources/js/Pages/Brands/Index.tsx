import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, Award } from 'lucide-react';

export default function BrandsIndex({ brands }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    name: '', description: '', is_active: true,
  });

  const handleOpenModal = (brand: any = null) => {
    setEditingBrand(brand);
    if (brand) {
      setData({ name: brand.name, description: brand.description || '', is_active: brand.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      put(`/brands/${editingBrand.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/brands', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Master Brand / Merk" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Master Brand / Merk</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola brand atau lini usaha resto di bawah holding.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Brand
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Brand</th>
              <th className="py-3.5 px-4">Deskripsi</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {brands?.data?.length > 0 ? (
              brands.data.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Award size={15} className="text-indigo-600" /> {b.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{b.description || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {b.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(b)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                    <button onClick={() => confirm('Hapus brand?') && router.delete(`/brands/${b.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada data brand.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Data Brand</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Brand *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Resto Group Utama" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Deskripsi</label>
                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} className="w-full px-3 py-2 text-xs border rounded-lg" />
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