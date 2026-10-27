import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Tag, Edit3, Trash2, X, Save, Layers 
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  type: 'INGREDIENT' | 'MENU' | 'ASSET';
  items_count?: number;
}

interface Props {
  categories: {
    data: Category[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  filters: { search?: string; type?: string };
}

export default function CategoriesIndex({ categories, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState(filters.type || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    type: 'INGREDIENT',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/categories', { search, type: selectedType }, { preserveState: true });
  };

  const handleOpenModal = (cat: Category | null = null) => {
    setEditingCategory(cat);
    if (cat) {
      setData({ name: cat.name, type: cat.type });
    } else {
      reset();
    }
    clearErrors();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      put(`/categories/${editingCategory.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/categories', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (cat: Category) => {
    if (confirm(`Hapus kategori "${cat.name}"?`)) {
      router.delete(`/categories/${cat.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Kategori Item" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Item</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan bahan baku, menu penjualan, dan aset operasional.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            router.get('/categories', { search, type: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-48 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
        >
          <option value="">Semua Tipe</option>
          <option value="INGREDIENT">Bahan Baku (Ingredient)</option>
          <option value="MENU">Menu Penjualan (POS)</option>
          <option value="ASSET">Aset / Perlengkapan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Nama Kategori</th>
              <th className="py-3.5 px-4">Tipe Peruntukan</th>
              <th className="py-3.5 px-4">Jumlah SKU Terkait</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {categories.data.length > 0 ? (
              categories.data.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{cat.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      cat.type === 'INGREDIENT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      cat.type === 'MENU' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {cat.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{cat.items_count || 0} Item</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(cat)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Belum ada kategori terdaftar.
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
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="misal: Daging & Unggas"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Peruntukan *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="INGREDIENT">Bahan Baku (Ingredient)</option>
                  <option value="MENU">Menu Penjualan (POS)</option>
                  <option value="ASSET">Aset / Perlengkapan</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                >
                  <Save size={14} />
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}