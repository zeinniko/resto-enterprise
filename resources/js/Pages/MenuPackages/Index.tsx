import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Package, Save, Trash, Layers 
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  code: string;
  selling_price: number;
}

interface PackageItemDetail {
  id?: number;
  menu_item_id: number;
  qty: number;
  menu_item?: MenuItem;
}

interface MenuPackage {
  id: number;
  menu_item_id: number;
  name: string;
  package_price: number;
  is_active: boolean;
  menu_item?: MenuItem;
  items?: PackageItemDetail[];
}

interface Props {
  packages?: {
    data: MenuPackage[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  menuItems?: MenuItem[];
  filters: { search?: string };
}

export default function MenuPackagesIndex({ 
  packages = { data: [], links: [], total: 0 }, 
  menuItems = [], 
  filters 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    menu_item_id: '',
    name: '',
    package_price: 0,
    is_active: true,
    items: [
      { menu_item_id: '', qty: 1 }
    ],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/menu-packages', { search }, { preserveState: true });
  };

  const handleOpenModal = (pkg: MenuPackage | null = null) => {
    clearErrors();
    setEditingPackage(pkg);
    if (pkg) {
      setData({
        menu_item_id: String(pkg.menu_item_id),
        name: pkg.name,
        package_price: Number(pkg.package_price),
        is_active: Boolean(pkg.is_active),
        items: pkg.items ? pkg.items.map(i => ({
          menu_item_id: String(i.menu_item_id),
          qty: i.qty,
        })) : [{ menu_item_id: '', qty: 1 }],
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setData('items', [...data.items, { menu_item_id: '', qty: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (data.items.length === 1) return;
    const updated = [...data.items];
    updated.splice(index, 1);
    setData('items', updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...data.items];
    updated[index] = { ...updated[index], [field]: value };
    setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      put(`/menu-packages/${editingPackage.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/menu-packages', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (pkg: MenuPackage) => {
    if (confirm(`Hapus paket bundling "${pkg.name}"?`)) {
      router.delete(`/menu-packages/${pkg.id}`);
    }
  };

  const listData = Array.isArray(packages?.data) ? packages.data : [];

  return (
    <DashboardLayout>
      <Head title="Paket Combo & Bundling" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Paket Combo & Bundling Menu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan beberapa menu POS menjadi satu paket hemat dengan harga khusus.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Buat Paket Combo
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama paket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listData.length > 0 ? (
          listData.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    [{pkg.menu_item?.code}] {pkg.menu_item?.name}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 mt-1">{pkg.name}</h2>
                  <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                    Rp {Number(pkg.package_price).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenModal(pkg)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(pkg)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Composition List */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Isi Menu Penyusun Paket</h3>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200/60">
                  {pkg.items?.map((pi, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Package size={13} className="text-indigo-500" />
                        {pi.menu_item?.name}
                      </span>
                      <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {pi.qty} Porsi
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            Belum ada paket combo bundling terdaftar.
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingPackage ? 'Edit Paket Combo' : 'Buat Paket Combo Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Menu POS Utama (Identitas Paket) *</label>
                <select
                  value={data.menu_item_id}
                  onChange={(e) => setData('menu_item_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Menu Utama Paket POS</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>
                  ))}
                </select>
                {errors.menu_item_id && <p className="text-[10px] text-rose-600 mt-1">{errors.menu_item_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Paket Combo *</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Paket Hemat NIKMAT"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Bundling (Rp) *</label>
                  <input
                    type="number"
                    step="any"
                    value={data.package_price}
                    onChange={(e) => setData('package_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.package_price && <p className="text-[10px] text-rose-600 mt-1">{errors.package_price}</p>}
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Isi Menu Penyusun Paket *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus size={13} /> Tambah Menu
                  </button>
                </div>

                <div className="space-y-2">
                  {data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={row.menu_item_id}
                        onChange={(e) => handleItemChange(idx, 'menu_item_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        <option value="">Pilih Isi Menu POS</option>
                        {menuItems.map((m) => (
                          <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-center"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkg_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="pkg_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Paket Aktif (Tampil di POS)
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
                  <Save size={14} />
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}