import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import ItemModal from './ItemModal';
import { Head, router } from '@inertiajs/react';
import { 
  Plus, Search, Boxes, Edit3, Trash2, Tag
} from 'lucide-react';

interface Category { id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }

interface Item {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  primary_unit_id: number;
  purchase_unit_id: number;
  category: Category;
  primary_unit: Unit;
  purchase_unit: Unit;
  shelf_life_days: number;
  is_active: boolean;
}

interface Props {
  items: {
    data: Item[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  categories: Category[];
  units: Unit[];
  filters: { search?: string; category_id?: string };
}

export default function ItemsIndex({ items, categories, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/items', { search, category_id: selectedCategory }, { preserveState: true });
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    router.get('/items', { search, category_id: catId }, { preserveState: true });
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: Item) => {
    if (confirm(`Apakah Anda yakin ingin menghapus item "${item.name}"?`)) {
      router.delete(`/items/${item.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Master SKU Item Global" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master SKU Item Global</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola katalog bahan baku, setengah jadi, dan barang operasional terpusat.
          </p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Tambah SKU Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari SKU atau nama barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kode SKU</th>
                <th className="py-3.5 px-4">Nama Item</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Satuan Utama</th>
                <th className="py-3.5 px-4">Satuan Beli</th>
                <th className="py-3.5 px-4">Masa Simpan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {items.data.length > 0 ? (
                items.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{item.sku}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                        <Tag size={10} />
                        {item.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.primary_unit?.name} ({item.primary_unit?.symbol})</td>
                    <td className="py-3 px-4 text-slate-500">{item.purchase_unit?.name} ({item.purchase_unit?.symbol})</td>
                    <td className="py-3 px-4">{item.shelf_life_days > 0 ? `${item.shelf_life_days} Hari` : 'Tanpa Expired'}</td>
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
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Boxes size={32} className="mx-auto mb-2 opacity-50" />
                    Belum ada data SKU Item. Silakan tambah data baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Total Data: <span className="font-semibold text-slate-700">{items.total}</span> SKU
          </p>
          <div className="flex gap-1">
            {items.links?.map((link, idx) => (
              <button
                key={idx}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  link.active 
                    ? 'bg-indigo-600 text-white font-medium' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal CRUD Component */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        categories={categories}
        units={units}
      />
    </DashboardLayout>
  );
}