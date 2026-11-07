import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, Store, Boxes, AlertTriangle, ShieldAlert
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; sku: string; name: string; primary_unit?: Unit; }

interface BranchItem {
  id: number;
  branch_id: number;
  item_id: number;
  min_stock: number;
  reorder_point: number;
  purchase_price: number;
  is_active: boolean;
  branch?: Branch;
  item?: Item;
}

interface Props {
  branchItems?: {
    data: BranchItem[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches?: Branch[];
  items?: Item[];
  filters: { search?: string; branch_id?: string };
}

export default function BranchItemsIndex({ 
  branchItems = { data: [], links: [], total: 0 }, 
  branches = [], 
  items = [], 
  filters 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranchItem, setEditingBranchItem] = useState<BranchItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    item_id: '',
    min_stock: 0,
    reorder_point: 0,
    purchase_price: 0,
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/branch-items', { search, branch_id: selectedBranch }, { preserveState: true });
  };

  const handleBranchFilter = (branchId: string) => {
    setSelectedBranch(branchId);
    router.get('/branch-items', { search, branch_id: branchId }, { preserveState: true });
  };

  const handleOpenModal = (bi: BranchItem | null = null) => {
    clearErrors();
    setEditingBranchItem(bi);
    if (bi) {
      setData({
        branch_id: String(bi.branch_id),
        item_id: String(bi.item_id),
        min_stock: Number(bi.min_stock),
        reorder_point: Number(bi.reorder_point),
        purchase_price: Number(bi.purchase_price),
        is_active: Boolean(bi.is_active),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranchItem) {
      put(`/branch-items/${editingBranchItem.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/branch-items', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (bi: BranchItem) => {
    if (confirm(`Hapus alokasi item "${bi.item?.name}" untuk cabang "${bi.branch?.name}"?`)) {
      router.delete(`/branch-items/${bi.id}`);
    }
  };

  const listData = Array.isArray(branchItems?.data) ? branchItems.data : [];

  return (
    <DashboardLayout>
      <Head title="Setting Item & Stok per Cabang" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Setting Item & Stok per Cabang</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan safety stock, reorder point (ROP), dan harga beli khusus per outlet.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Alokasi Item Cabang
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari SKU atau nama item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <select
          value={selectedBranch}
          onChange={(e) => handleBranchFilter(e.target.value)}
          className="w-full sm:w-60 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
        >
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Kode SKU / Nama Item</th>
                <th className="py-3.5 px-4">Min. Stock</th>
                <th className="py-3.5 px-4">Reorder Point (ROP)</th>
                <th className="py-3.5 px-4">Harga Beli Cabang</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {listData.length > 0 ? (
                listData.map((bi) => (
                  <tr key={bi.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <Store size={14} className="text-indigo-600" />
                      {bi.branch?.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-indigo-600 font-semibold text-[11px]">{bi.item?.sku}</div>
                      <div className="font-medium text-slate-800">{bi.item?.name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-700">
                      {Number(bi.min_stock).toLocaleString('id-ID')} {bi.item?.primary_unit?.symbol}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {Number(bi.reorder_point).toLocaleString('id-ID')} {bi.item?.primary_unit?.symbol}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      Rp {Number(bi.purchase_price).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        bi.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {bi.is_active ? 'Aktif Cabang' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenModal(bi)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(bi)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Boxes size={32} className="mx-auto mb-2 opacity-50" />
                    Belum ada alokasi setting item cabang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBranchItem ? 'Edit Setting Item Cabang' : 'Alokasi Item ke Cabang'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select
                  value={data.branch_id}
                  onChange={(e) => setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Cabang Target</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Item Global *</label>
                <select
                  value={data.item_id}
                  onChange={(e) => setData('item_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Item SKU</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>
                  ))}
                </select>
                {errors.item_id && <p className="text-[10px] text-rose-600 mt-1">{errors.item_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Safety Stock (Min) *</label>
                  <input
                    type="number"
                    step="any"
                    value={data.min_stock}
                    onChange={(e) => setData('min_stock', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.min_stock && <p className="text-[10px] text-rose-600 mt-1">{errors.min_stock}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Point (ROP) *</label>
                  <input
                    type="number"
                    step="any"
                    value={data.reorder_point}
                    onChange={(e) => setData('reorder_point', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.reorder_point && <p className="text-[10px] text-rose-600 mt-1">{errors.reorder_point}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli Cabang (Rp) *</label>
                <input
                  type="number"
                  step="any"
                  value={data.purchase_price}
                  onChange={(e) => setData('purchase_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.purchase_price && <p className="text-[10px] text-rose-600 mt-1">{errors.purchase_price}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bi_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="bi_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Item Aktif di Cabang Ini
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
                  Simpan Setting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}