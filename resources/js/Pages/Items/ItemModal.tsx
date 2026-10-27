import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Save, AlertCircle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

interface Item {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  primary_unit_id: number;
  purchase_unit_id: number;
  shelf_life_days: number;
  is_active: boolean;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  categories: Category[];
  units: Unit[];
}

export default function ItemModal({ isOpen, onClose, item, categories, units }: ItemModalProps) {
  const isEditing = Boolean(item);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    sku: '',
    name: '',
    category_id: '',
    primary_unit_id: '',
    purchase_unit_id: '',
    shelf_life_days: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setData({
        sku: item.sku,
        name: item.name,
        category_id: String(item.category_id),
        primary_unit_id: String(item.primary_unit_id),
        purchase_unit_id: String(item.purchase_unit_id),
        shelf_life_days: item.shelf_life_days,
        is_active: item.is_active,
      });
    } else {
      reset();
    }
    clearErrors();
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && item) {
      put(`/items/${item.id}`, {
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    } else {
      post('/items', {
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            {isEditing ? 'Edit SKU Item' : 'Tambah SKU Item Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU *</label>
              <input
                type="text"
                value={data.sku}
                onChange={(e) => setData('sku', e.target.value)}
                placeholder="misal: ING-001"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-mono ${
                  errors.sku ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.sku && <p className="text-[10px] text-rose-500 mt-1">{errors.sku}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
              <select
                value={data.category_id}
                onChange={(e) => setData('category_id', e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 ${
                  errors.category_id ? 'border-rose-500' : 'border-slate-300'
                }`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-[10px] text-rose-500 mt-1">{errors.category_id}</p>}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Item *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="misal: Daging Sapi Slice 500g"
              className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 ${
                errors.name ? 'border-rose-500' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Primary Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Utama (Stok) *</label>
              <select
                value={data.primary_unit_id}
                onChange={(e) => setData('primary_unit_id', e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 ${
                  errors.primary_unit_id ? 'border-rose-500' : 'border-slate-300'
                }`}
              >
                <option value="">Pilih Satuan</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
              {errors.primary_unit_id && <p className="text-[10px] text-rose-500 mt-1">{errors.primary_unit_id}</p>}
            </div>

            {/* Purchase Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Pembelian *</label>
              <select
                value={data.purchase_unit_id}
                onChange={(e) => setData('purchase_unit_id', e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 ${
                  errors.purchase_unit_id ? 'border-rose-500' : 'border-slate-300'
                }`}
              >
                <option value="">Pilih Satuan</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                ))}
              </select>
              {errors.purchase_unit_id && <p className="text-[10px] text-rose-500 mt-1">{errors.purchase_unit_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Shelf Life Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Simpan (Hari)</label>
              <input
                type="number"
                min="0"
                value={data.shelf_life_days}
                onChange={(e) => setData('shelf_life_days', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Isi 0 jika tidak ada kadaluwarsa</p>
            </div>

            {/* Active Checkbox */}
            <div className="pt-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">Status Aktif</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={14} />
              {processing ? 'Menyimpan...' : 'Simpan SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}