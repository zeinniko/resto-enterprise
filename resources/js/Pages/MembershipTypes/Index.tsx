import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Crown, Edit3, Trash2, X } from 'lucide-react';

interface Membership {
  id: number;
  name: string;
  min_points: number;
  discount_percentage: number;
  is_active: boolean;
}

interface Props {
  memberships: { data: Membership[] };
}

export default function MembershipTypesIndex({ memberships }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<Membership | null>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    name: '', min_points: 0, discount_percentage: 0, is_active: true,
  });

  const handleOpenModal = (type: Membership | null = null) => {
    setEditingType(type);
    if (type) {
      setData({ name: type.name, min_points: type.min_points, discount_percentage: type.discount_percentage, is_active: type.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      put(`/membership-types/${editingType.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/membership-types', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Tingkat Membership" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tingkat Keanggotaan (Membership Levels)</h1>
          <p className="text-xs text-slate-500 mt-1">Pengaturan kriteria poin loyalti dan persentase diskon member (Silver, Gold, Platinum).</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Level Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tingkat Membership</th>
              <th className="py-3.5 px-4">Syarat Minimum Poin</th>
              <th className="py-3.5 px-4">Diskon Member (%)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {memberships.data.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <Crown size={15} className="text-amber-500" /> {m.name}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{m.min_points} Poin</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-600">+{m.discount_percentage}% Off</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {m.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-1">
                  <button onClick={() => handleOpenModal(m)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                  <button onClick={() => confirm('Hapus level?') && router.delete(`/membership-types/${m.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Level Membership</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Tingkat *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Gold Tier" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Min. Poin *</label>
                  <input type="number" value={data.min_points} onChange={(e) => setData('min_points', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Diskon (%) *</label>
                  <input type="number" step="any" value={data.discount_percentage} onChange={(e) => setData('discount_percentage', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Level</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}