import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, Percent } from 'lucide-react';

export default function DiscountsIndex({ discounts }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    name: '', type: 'PERCENTAGE', value: 0, is_active: true,
  });

  const handleOpenModal = (item: any = null) => {
    setEditing(item);
    if (item) {
      setData({ name: item.name, type: item.type, value: item.value, is_active: item.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      put(`/discounts/${editing.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/discounts', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Manajemen Diskon" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Diskon</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola program promosi dan skema diskon POS.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Diskon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Diskon</th>
              <th className="py-3.5 px-4">Tipe</th>
              <th className="py-3.5 px-4">Nilai</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {discounts?.data?.length > 0 ? (
              discounts.data.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Percent size={15} className="text-indigo-600" /> {d.name}
                  </td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{d.type}</span></td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${Number(d.value).toLocaleString('id-ID')}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {d.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(d)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                    <button onClick={() => confirm('Hapus diskon?') && router.delete(`/discounts/${d.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">Belum ada data diskon.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Data Diskon</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Diskon *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Promo Happy Hour 10%" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipe Diskon *</label>
                  <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nilai *</label>
                  <input type="number" step="any" value={data.value} onChange={(e) => setData('value', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
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