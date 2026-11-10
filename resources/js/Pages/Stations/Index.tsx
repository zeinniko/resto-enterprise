import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Printer, Edit3, Trash2, X, Save, Layers } from 'lucide-react';

interface StationItem {
  id: number;
  branch_id: number;
  name: string;
  printer_ip: string | null;
  is_active: boolean;
  branch?: { id: number; name: string; code: string };
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface Props {
  stations?: { data: StationItem[]; total: number };
  branches?: Branch[];
  filters?: { search?: string };
}

export default function StationsIndex({ 
  stations = { data: [], total: 0 }, 
  branches = [], 
  filters = {} 
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    name: '',
    printer_ip: '',
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/stations', { search }, { preserveState: true });
  };

  const handleOpenModal = (station: StationItem | null = null) => {
    clearErrors();
    setEditingStation(station);
    if (station) {
      setData({ 
        branch_id: String(station.branch_id), 
        name: station.name, 
        printer_ip: station.printer_ip || '', 
        is_active: Boolean(station.is_active) 
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStation) {
      put(`/stations/${editingStation.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/stations', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (station: StationItem) => {
    if (confirm(`Hapus station "${station.name}"?`)) {
      router.delete(`/stations/${station.id}`);
    }
  };

  const stationsList = Array.isArray(stations?.data) ? stations.data : [];

  return (
    <DashboardLayout>
      <Head title="Station Dapur" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Station Dapur & Thermal Printer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Routing order cetak tiket otomatis per divisi dapur (Bar, Hot Kitchen, Cold Kitchen).
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal(null)} 
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Station
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Station Dapur</th>
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">IP Thermal Printer LAN</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {stationsList.length > 0 ? (
              stationsList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    [{s.branch?.code}] {s.branch?.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-600">
                    <Printer size={13} className="inline mr-1 text-slate-400" />
                    {s.printer_ip || 'Tanpa Printer Direct'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      {s.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(s)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(s)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada station dapur terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingStation ? 'Edit Station Dapur' : 'Tambah Station Dapur Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Station Dapur *</label>
                <input 
                  type="text" 
                  value={data.name} 
                  onChange={(e) => setData('name', e.target.value)} 
                  placeholder="misal: Kitchen Hot / Bar & Beverage" 
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500" 
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IP Address Thermal Printer LAN (Opsional)</label>
                <input 
                  type="text" 
                  value={data.printer_ip} 
                  onChange={(e) => setData('printer_ip', e.target.value)} 
                  placeholder="192.168.1.200" 
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500" 
                />
                {errors.printer_ip && <p className="text-[10px] text-rose-600 mt-1">{errors.printer_ip}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="st_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                />
                <label htmlFor="st_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Station Aktif
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
                  <Save size={14} /> Simpan Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}