import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, Tag 
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  type: 'raw_material' | 'semi_finished' | 'packaging' | 'non_food';
  items_count?: number;
}

interface Props {
  categories?: {
    data: Category[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  filters: { search?: string; type?: string };
}

export default function CategoriesIndex({ categories = { data: [], links: [], total: 0 }, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState(filters.type || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    type: 'raw_material' as Category['type'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/categories', { search, type: selectedType }, { preserveState: true });
  };

  const handleOpenModal = (cat: Category | null = null) => {
    clearErrors();
    setEditingCategory(cat);
    if (cat) {
      setData({ name: cat.name, type: cat.type });
    } else {
      reset();
    }
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

  const getTypeBadge = (type: Category['type']) => {
    switch (type) {
      case 'raw_material':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Bahan Mentah (Raw)</span>;
      case 'semi_finished':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Setengah Jadi / Bumbu</span>;
      case 'packaging':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Kemasan & Packaging</span>;
      case 'non_food':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Non-Food & Perlengkapan</span>;
      default:
        return type;
    }
  };

  const listCategories = Array.isArray(categories?.data) ? categories.data : [];

  return (
    <DashboardLayout>
      <Head title="Kategori Item" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Item Inventaris</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan bahan mentah, olahan setengah jadi, packaging, dan barang non-food.
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
          className="w-full sm:w-56 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
        >
          <option value="">Semua Tipe Peruntukan</option>
          <option value="raw_material">Bahan Mentah (Raw Material)</option>
          <option value="semi_finished">Bahan Setengah Jadi / Prepped</option>
          <option value="packaging">Kemasan & Packaging</option>
          <option value="non_food">Non-Food & Operational Supplies</option>
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
            {listCategories.length > 0 ? (
              listCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Tag size={14} className="text-indigo-600" />
                    {cat.name}
                  </td>
                  <td className="py-3 px-4">{getTypeBadge(cat.type)}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono font-semibold">
                    {cat.items_count || 0} Item
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(cat)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Belum ada kategori terdaftar. Silakan tambah data baru.
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
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Peruntukan *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as Category['type'])}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="raw_material">Bahan Mentah (Raw Material)</option>
                  <option value="semi_finished">Bahan Setengah Jadi / Prepped / Bumbu</option>
                  <option value="packaging">Kemasan & Packaging</option>
                  <option value="non_food">Non-Food & Perlengkapan Operasional</option>
                </select>
                {errors.type && <p className="text-[10px] text-rose-600 mt-1">{errors.type}</p>}
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