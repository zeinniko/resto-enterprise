import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Crown, Edit3, Trash2, X, Search, Save, Layers, Award } from 'lucide-react';

interface Membership {
  id: number;
  code?: string;
  name: string;
  min_points: number;
  discount_percentage: number;
  is_active: boolean;
}

interface Props {
  memberships?: { data: Membership[]; total: number };
  filters?: { search?: string };
}

export default function MembershipTypesIndex({ 
  memberships = { data: [], total: 0 }, 
  filters = {} 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<Membership | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    min_points: 0,
    discount_percentage: 0,
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/membership-types', { search }, { preserveState: true });
  };

  const handleOpenModal = (type: Membership | null = null) => {
    clearErrors();
    setEditingType(type);
    if (type) {
      setData({
        code: type.code || '',
        name: type.name,
        min_points: type.min_points,
        discount_percentage: Number(type.discount_percentage),
        is_active: Boolean(type.is_active),
      });
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

  const handleDelete = (type: Membership) => {
    if (confirm(`Hapus level keanggotaan "${type.name}"?`)) {
      router.delete(`/membership-types/${type.id}`);
    }
  };

  const listData = Array.isArray(memberships?.data) ? memberships.data : [];

  return (
    <DashboardLayout>
      <Head title="Tingkat Membership" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tingkat Keanggotaan (Membership Levels)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan kriteria poin loyalti dan persentase diskon member (Silver, Gold, Platinum).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Level Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari level membership..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Tingkat Membership</th>
              <th className="py-3.5 px-4">Syarat Minimum Poin</th>
              <th className="py-3.5 px-4">Diskon Member (%)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {listData.length > 0 ? (
              listData.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {m.code || `MEM-${m.id}`}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Crown size={15} className="text-amber-500 shrink-0" />
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {Number(m.min_points).toLocaleString('id-ID')} Poin
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    +{Number(m.discount_percentage)}% Off
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {m.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(m)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada tingkat keanggotaan terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingType ? 'Edit Level Membership' : 'Input Level Membership Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Tier (Opsional)</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  placeholder="e.g. BRONZE / GOLD / PLATINUM"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.code && <p className="text-[10px] text-rose-600 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tingkat *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. Silver Tier / Gold VIP Member"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Poin Loyalti *</label>
                  <input
                    type="number"
                    min="0"
                    value={data.min_points}
                    onChange={(e) => setData('min_points', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.min_points && <p className="text-[10px] text-rose-600 mt-1">{errors.min_points}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diskon Member (%) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={data.discount_percentage}
                    onChange={(e) => setData('discount_percentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.discount_percentage && <p className="text-[10px] text-rose-600 mt-1">{errors.discount_percentage}</p>}
                </div>
              </div>

              {/* Checkbox Status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mt_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500"
                />
                <label htmlFor="mt_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Level Member Aktif
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm"
                >
                  <Save size={14} /> Simpan Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}