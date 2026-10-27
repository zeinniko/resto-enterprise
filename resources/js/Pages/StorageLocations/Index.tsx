import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, Warehouse, Building2, Snowflake, Thermometer, Sun
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
  type: 'DRY' | 'CHILLER' | 'FREEZER';
  is_active: boolean;
  branch?: Branch;
}

interface Props {
  storageLocations: {
    data: StorageLocation[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches: Branch[];
  filters: { search?: string; branch_id?: string };
}

export default function StorageLocationsIndex({ storageLocations, branches, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    name: '',
    type: 'DRY',
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
    setEditingLocation(loc);
    if (loc) {
      setData({
        branch_id: String(loc.branch_id),
        name: loc.name,
        type: loc.type,
        is_active: loc.is_active,
      });
    } else {
      reset();
    }
    clearErrors();
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

  return (
    <DashboardLayout>
      <Head title="Lokasi Penyimpanan" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lokasi Penyimpanan (Gudang)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan area penyimpanan barang per cabang (Dry, Chiller, Freezer).
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
          className="w-full sm:w-60 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
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
            {storageLocations.data.length > 0 ? (
              storageLocations.data.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{loc.branch?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{loc.name}</td>
                  <td className="py-3 px-4">
                    {loc.type === 'DRY' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Sun size={11} /> DRY STORAGE
                      </span>
                    )}
                    {loc.type === 'CHILLER' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        <Thermometer size={11} /> CHILLER (0°C - 4°C)
                      </span>
                    )}
                    {loc.type === 'FREEZER' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Snowflake size={11} /> FREEZER (&lt; -18°C)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {loc.is_active ? (
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
                      <button onClick={() => handleOpenModal(loc)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(loc)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
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
                  Belum ada lokasi penyimpanan terdaftar.
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-500 mt-1">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lokasi Penyimpanan *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="misal: Chiller Dapur Utama"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Suhu / Ruangan *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DRY">DRY STORAGE (Suhu Ruangan)</option>
                  <option value="CHILLER">CHILLER (0°C s/d 4°C)</option>
                  <option value="FREEZER">FREEZER (&lt; -18°C)</option>
                </select>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-slate-700">Status Aktif</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">
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