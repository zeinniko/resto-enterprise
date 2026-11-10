import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, AlertCircle, Search, Edit3, Trash2, Save, Layers } from 'lucide-react';

interface ReasonItem {
  id: number;
  reason: string;
  type: 'ORDER_CANCEL' | 'ITEM_VOID';
  is_active: boolean;
}

interface Props {
  reasons?: { data: ReasonItem[]; total: number };
  filters?: { search?: string };
}

export default function CancelReasonsIndex({ 
  reasons = { data: [], total: 0 }, 
  filters = {} 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    reason: '',
    type: 'ORDER_CANCEL' as 'ORDER_CANCEL' | 'ITEM_VOID',
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/cancel-reasons', { search }, { preserveState: true });
  };

  const handleOpenModal = (item: ReasonItem | null = null) => {
    clearErrors();
    setEditingReason(item);
    if (item) {
      setData({
        reason: item.reason,
        type: item.type,
        is_active: Boolean(item.is_active),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReason) {
      put(`/cancel-reasons/${editingReason.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/cancel-reasons', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (item: ReasonItem) => {
    if (confirm(`Hapus alasan pembatalan "${item.reason}"?`)) {
      router.delete(`/cancel-reasons/${item.id}`);
    }
  };

  const listData = Array.isArray(reasons?.data) ? reasons.data : [];

  return (
    <DashboardLayout>
      <Head title="Alasan Pembatalan (Void)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alasan Pembatalan (Void/Cancel)</h1>
          <p className="text-xs text-slate-500 mt-1">Daftar standar alasan pembatalan item atau nota transaksi oleh kasir.</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Alasan
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari alasan pembatalan..."
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
              <th className="py-3.5 px-4">Keterangan Alasan</th>
              <th className="py-3.5 px-4">Tipe Pembatalan</th>
              <th className="py-3.5 px-4">Status POS</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {listData.length > 0 ? (
              listData.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                    <span>{r.reason}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        r.type === 'ITEM_VOID'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {r.type === 'ITEM_VOID' ? 'ITEM VOID (Per Porsi)' : 'ORDER CANCEL (Satu Nota)'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {r.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(r)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
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
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada alasan pembatalan terdaftar.
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
                {editingReason ? 'Edit Alasan Void' : 'Tambah Alasan Pembatalan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Pembatalan *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as 'ORDER_CANCEL' | 'ITEM_VOID')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="ORDER_CANCEL">ORDER_CANCEL (Batal Seluruh Nota Pesanan)</option>
                  <option value="ITEM_VOID">ITEM_VOID (Hapus Porsi Item Spesifik)</option>
                </select>
                {errors.type && <p className="text-[10px] text-rose-600 mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Alasan *</label>
                <input
                  type="text"
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                  placeholder="misal: Pelanggan Batal Pesan (Antrean Lama)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.reason && <p className="text-[10px] text-rose-600 mt-1">{errors.reason}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cr_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500"
                />
                <label htmlFor="cr_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Alasan Aktif di POS
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
                  <Save size={14} /> Simpan Alasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}