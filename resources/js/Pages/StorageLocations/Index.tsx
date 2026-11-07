import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, Warehouse, Building2, Snowflake, Thermometer, Sun, Monitor
} from 'lucide-react';

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface StorageLocation {
  id: number;
  branch_id: number;
  name: string;
  type: 'dry' | 'cold' | 'freezer' | 'display';
  is_active: boolean;
  branch?: Branch;
}

interface Props {
  storageLocations?: {
    data: StorageLocation[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches?: Branch[];
  filters: { search?: string; branch_id?: string };
}

export default function StorageLocationsIndex({ 
  storageLocations = { data: [], links: [], total: 0 }, 
  branches = [], 
  filters 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    name: '',
    type: 'dry' as StorageLocation['type'],
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/storage-locations', { search, branch_id: selectedBranch }, { preserveState: true });
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    router.get('/storage-locations', { search, branch_id: branchId }, { preserveState: true });
  };

  const handleOpenModal = (loc: StorageLocation | null = null) => {
    clearErrors();
    setEditingLocation(loc);
    if (loc) {
      setData({
        branch_id: String(loc.branch_id),
        name: loc.name,
        type: loc.type,
        is_active: Boolean(loc.is_active),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      put(`/storage-locations/${editingLocation.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/storage-locations', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (loc: StorageLocation) => {
    if (confirm(`Hapus lokasi penyimpanan "${loc.name}"?`)) {
      router.delete(`/storage-locations/${loc.id}`);
    }
  };

  const getTypeBadge = (type: StorageLocation['type']) => {
    switch (type) {
      case 'dry':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Sun size={11} /> DRY STORAGE
          </span>
        );
      case 'cold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Thermometer size={11} /> COLD / CHILLER
          </span>
        );
      case 'freezer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Snowflake size={11} /> FREEZER
          </span>
        );
      case 'display':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Monitor size={11} /> DISPLAY / ETALASE
          </span>
        );
      default:
        return type;
    }
  };

  const listLocations = Array.isArray(storageLocations?.data) ? storageLocations.data : [];

  return (
    <DashboardLayout>
      <Head title="Lokasi Penyimpanan" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lokasi Penyimpanan (Gudang)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan area penyimpanan barang per cabang (Dry, Cold, Freezer, Display).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Tambah Lokasi
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <select
          value={selectedBranch}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="w-full sm:w-60 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
        >
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">Nama Lokasi Penyimpanan</th>
              <th className="py-3.5 px-4">Tipe Suhu / Ruangan</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {listLocations.length > 0 ? (
              listLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{loc.branch?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{loc.name}</td>
                  <td className="py-3 px-4">{getTypeBadge(loc.type)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      loc.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {loc.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenModal(loc)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(loc)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada lokasi penyimpanan terdaftar. Silakan tambah data baru.
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
                {editingLocation ? 'Edit Lokasi Penyimpanan' : 'Tambah Lokasi Penyimpanan'}
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
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lokasi Penyimpanan *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="misal: Chiller Main, Walk-in Freezer, Bar Storage"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Suhu / Ruangan *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as StorageLocation['type'])}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="dry">DRY STORAGE (Suhu Ruangan)</option>
                  <option value="cold">COLD STORAGE / CHILLER (0°C - 4°C)</option>
                  <option value="freezer">FREEZER (&lt; -18°C)</option>
                  <option value="display">DISPLAY / ETALASE DEPAN</option>
                </select>
                {errors.type && <p className="text-[10px] text-rose-600 mt-1">{errors.type}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="loc_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="loc_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Lokasi Aktif
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
                  Simpan Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}