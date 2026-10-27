import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, UtensilsCrossed, CheckCircle2, AlertCircle
} from 'lucide-react';

interface MenuItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  selling_price: number;
  is_active: boolean;
  recipe?: { id: number };
}

interface Props {
  menuItems: {
    data: MenuItem[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  filters: { search?: string };
}

export default function MenuItemsIndex({ menuItems, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    description: '',
    selling_price: '',
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/menu-items', { search }, { preserveState: true });
  };

  const handleOpenModal = (item: MenuItem | null = null) => {
    setEditingItem(item);
    if (item) {
      setData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        selling_price: String(item.selling_price),
        is_active: item.is_active,
      });
    } else {
      reset();
    }
    clearErrors();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      put(`/menu-items/${editingItem.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/menu-items', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (item: MenuItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus menu "${item.name}"?`)) {
      router.delete(`/menu-items/${item.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Daftar Menu POS" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Menu POS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Katalog makanan dan minuman yang dijual langsung di mesin kasir (POS).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Tambah Menu Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kode atau nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Kode Menu</th>
              <th className="py-3.5 px-4">Nama Menu Penjualan</th>
              <th className="py-3.5 px-4">Harga Jual</th>
              <th className="py-3.5 px-4">Resep (BOM)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {menuItems.data.length > 0 ? (
              menuItems.data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{item.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    Rp {Number(item.selling_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    {item.recipe ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Resep Ada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={11} /> Belum Ada Resep
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(item)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada menu penjualan terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Menu Penjualan' : 'Tambah Menu Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Menu *</label>
                  <input
                    type="text"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value)}
                    placeholder="MNU-001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.code && <p className="text-[10px] text-rose-500 mt-1">{errors.code}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={data.selling_price}
                    onChange={(e) => setData('selling_price', e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.selling_price && <p className="text-[10px] text-rose-500 mt-1">{errors.selling_price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Nasi Goreng Wagyu"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Catatan menu atau bahan komposisi..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-slate-700">Status Aktif (Tampil di POS)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                  <Save size={14} />
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}