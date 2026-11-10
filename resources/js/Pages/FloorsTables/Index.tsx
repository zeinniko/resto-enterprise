import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Users, X, Save, Layers, Trash2, Filter } from 'lucide-react';

interface TableItem {
  id: number;
  number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
}

interface FloorItem {
  id: number;
  name: string;
  branch_id: number;
  branch?: { id: number; name: string; code: string };
  tables?: TableItem[];
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface Props {
  floors?: { data: FloorItem[]; total: number };
  branches?: Branch[];
  filters?: { branch_id?: string };
}

export default function FloorsTablesIndex({ 
  floors = { data: [], total: 0 }, 
  branches = [], 
  filters = {} 
}: Props) {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(filters.branch_id || '');
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const floorForm = useForm({
    branch_id: '',
    name: '',
  });

  const tableForm = useForm({
    floor_id: '',
    number: '',
    capacity: 2,
  });

  const handleBranchFilterChange = (branchId: string) => {
    setSelectedBranchFilter(branchId);
    router.get('/floors-tables', { branch_id: branchId }, { preserveState: true });
  };

  const handleFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    floorForm.post('/floors', {
      onSuccess: () => {
        setIsFloorModalOpen(false);
        floorForm.reset();
      },
    });
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tableForm.post('/tables', {
      onSuccess: () => {
        setIsTableModalOpen(false);
        tableForm.reset();
      },
    });
  };

  const handleTableStatusChange = (tableId: number, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING') => {
    router.patch(`/tables/${tableId}/status`, { status });
  };

  const handleDeleteFloor = (floor: FloorItem) => {
    if (confirm(`Hapus area "${floor.name}" beserta seluruh meja di dalamnya?`)) {
      router.delete(`/floors/${floor.id}`);
    }
  };

  const handleDeleteTable = (table: TableItem) => {
    if (confirm(`Hapus Meja ${table.number}?`)) {
      router.delete(`/tables/${table.id}`);
    }
  };

  const floorsList = Array.isArray(floors?.data) ? floors.data : [];

  return (
    <DashboardLayout>
      <Head title="Layout Meja & Denah" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Layout Meja & Denah Outlets</h1>
          <p className="text-xs text-slate-500 mt-1">
            Atur denah area makan dan penomoran meja fisik untuk visualisasi POS Dine-In.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { floorForm.clearErrors(); floorForm.reset(); setIsFloorModalOpen(true); }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            + Tambah Area / Lantai
          </button>
          <button
            onClick={() => { tableForm.clearErrors(); tableForm.reset(); setIsTableModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-indigo-200 transition-colors"
          >
            <Plus size={16} />
            Tambah Meja
          </button>
        </div>
      </div>

      {/* Filter Cabang */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
        <Filter size={15} className="text-slate-400" />
        <select
          value={selectedBranchFilter}
          onChange={(e) => handleBranchFilterChange(e.target.value)}
          className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Semua Cabang Outlets</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
          ))}
        </select>
      </div>

      {/* Grid Denah & Meja */}
      <div className="space-y-6">
        {floorsList.length > 0 ? (
          floorsList.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">{f.name}</h2>
                  <span className="text-xs font-normal text-slate-400">({f.branch?.name})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {f.tables?.length || 0} Meja Terdaftar
                  </span>
                  <button 
                    onClick={() => handleDeleteFloor(f)} 
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                    title="Hapus Area Ini"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {f.tables && f.tables.length > 0 ? (
                  f.tables.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border text-center space-y-1.5 transition-all relative group ${
                        t.status === 'AVAILABLE'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : t.status === 'OCCUPIED'
                          ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                          : t.status === 'RESERVED'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                          : 'bg-sky-50/60 border-sky-200 text-sky-900'
                      }`}
                    >
                      <button
                        onClick={() => handleDeleteTable(t)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Hapus Meja"
                      >
                        <X size={13} />
                      </button>

                      <p className="font-bold text-sm tracking-tight">Meja {t.number}</p>
                      <p className="text-[10px] flex items-center justify-center gap-1 font-semibold opacity-75">
                        <Users size={11} /> {t.capacity} Orang
                      </p>

                      <select
                        value={t.status}
                        onChange={(e) => handleTableStatusChange(t.id, e.target.value as any)}
                        className="w-full text-[9px] font-bold uppercase rounded bg-white/90 border-slate-200 py-0.5 px-1 focus:outline-none cursor-pointer shadow-xs text-center"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="CLEANING">CLEANING</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                    Belum ada meja fisik terdaftar di area ini.
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            Belum ada denah area terdaftar.
          </div>
        )}
      </div>

      {/* Modal Tambah Area / Lantai */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Tambah Area / Lantai Baru</h2>
              <button onClick={() => setIsFloorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFloorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select
                  value={floorForm.data.branch_id}
                  onChange={(e) => floorForm.setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                  ))}
                </select>
                {floorForm.errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{floorForm.errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Area / Lantai *</label>
                <input
                  type="text"
                  value={floorForm.data.name}
                  onChange={(e) => floorForm.setData('name', e.target.value)}
                  placeholder="misal: Lantai 1, Outdoor, VIP Room"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {floorForm.errors.name && <p className="text-[10px] text-rose-600 mt-1">{floorForm.errors.name}</p>}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFloorModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={floorForm.processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-indigo-700"
                >
                  <Save size={14} />
                  Simpan Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Meja */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Tambah Meja Fisik Baru</h2>
              <button onClick={() => setIsTableModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Lantai *</label>
                <select
                  value={tableForm.data.floor_id}
                  onChange={(e) => tableForm.setData('floor_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Pilih Area / Lantai</option>
                  {floorsList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.branch?.name})</option>
                  ))}
                </select>
                {tableForm.errors.floor_id && <p className="text-[10px] text-rose-600 mt-1">{tableForm.errors.floor_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. / Kode Meja *</label>
                  <input
                    type="text"
                    value={tableForm.data.number}
                    onChange={(e) => tableForm.setData('number', e.target.value)}
                    placeholder="e.g. T-01, Meja 12"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {tableForm.errors.number && <p className="text-[10px] text-rose-600 mt-1">{tableForm.errors.number}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas (Orang) *</label>
                  <input
                    type="number"
                    min="1"
                    value={tableForm.data.capacity}
                    onChange={(e) => tableForm.setData('capacity', parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {tableForm.errors.capacity && <p className="text-[10px] text-rose-600 mt-1">{tableForm.errors.capacity}</p>}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={tableForm.processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-indigo-700"
                >
                  <Save size={14} />
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}