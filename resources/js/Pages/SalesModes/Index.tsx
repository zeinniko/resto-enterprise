import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, Search, Save, Layers, ShoppingBag } from 'lucide-react';

interface SalesModeItem {
  id: number;
  code: string;
  name: string;
  markup_percentage: number;
  is_active: boolean;
}

interface Props {
  salesModes?: { data: SalesModeItem[]; total: number };
  filters?: { search?: string };
}

export default function SalesModesIndex({ salesModes = { data: [], total: 0 }, filters = {} }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<SalesModeItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    markup_percentage: 0,
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/sales-modes', { search }, { preserveState: true });
  };

  const handleOpenModal = (mode: SalesModeItem | null = null) => {
    clearErrors();
    setEditingMode(mode);
    if (mode) {
      setData({
        code: mode.code,
        name: mode.name,
        markup_percentage: Number(mode.markup_percentage),
        is_active: Boolean(mode.is_active),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMode) {
      put(`/sales-modes/${editingMode.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/sales-modes', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (mode: SalesModeItem) => {
    if (confirm(`Hapus sales mode "${mode.name}"?`)) {
      router.delete(`/sales-modes/${mode.id}`);
    }
  };

  const listData = Array.isArray(salesModes?.data) ? salesModes.data : [];

  return (
    <DashboardLayout>
      <Head title="Mode Penjualan (Sales Modes)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mode Penjualan (Sales Modes)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kanal penjualan POS (Dine-In, Takeaway, GoFood, GrabFood) beserta persentase harga markup margin.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Sales Mode
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kode atau nama mode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode Mode</th>
              <th className="py-3.5 px-4">Nama Mode Penjualan</th>
              <th className="py-3.5 px-4">Markup Harga (%)</th>
              <th className="py-3.5 px-4">Status POS</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {listData.length > 0 ? (
              listData.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{m.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={15} className="text-slate-400" /> {m.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-700">
                    +{Number(m.markup_percentage)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {m.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(m)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(m)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada mode penjualan terdaftar.
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
                {editingMode ? 'Edit Sales Mode' : 'Input Sales Mode Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Sales Mode *</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  placeholder="DINE_IN / GOFOOD"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.code && <p className="text-[10px] text-rose-600 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sales Mode *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Dine-In Restaurant"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Persentase Markup Harga (%)</label>
                <input
                  type="number"
                  step="any"
                  value={data.markup_percentage}
                  onChange={(e) => setData('markup_percentage', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.markup_percentage && <p className="text-[10px] text-rose-600 mt-1">{errors.markup_percentage}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sm_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                />
                <label htmlFor="sm_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Mode Penjualan Aktif
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
                  <Save size={14} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}