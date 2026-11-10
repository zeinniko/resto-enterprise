import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, Clock, Edit3, Trash2, Search, Save, Layers, Moon, Sun, Building2 } from 'lucide-react';

interface WorkShiftItem {
  id: number;
  branch_id?: number | null;
  name: string;
  start_time: string;
  end_time: string;
  is_overnight: boolean;
  branch?: { id: number; name: string; code: string };
}

interface BranchItem {
  id: number;
  name: string;
  code: string;
}

interface Props {
  shifts?: { data: WorkShiftItem[]; total: number };
  branches?: BranchItem[];
  filters?: { search?: string };
}

export default function WorkShiftsIndex({
  shifts = { data: [], total: 0 },
  branches = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShiftItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '' as string | number,
    name: '',
    start_time: '08:00',
    end_time: '16:00',
    is_overnight: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/work-shifts', { search }, { preserveState: true });
  };

  const handleOpenModal = (shift: WorkShiftItem | null = null) => {
    clearErrors();
    setEditingShift(shift);
    if (shift) {
      setData({
        branch_id: shift.branch_id || '',
        name: shift.name,
        start_time: shift.start_time.substring(0, 5),
        end_time: shift.end_time.substring(0, 5),
        is_overnight: Boolean(shift.is_overnight),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      put(`/work-shifts/${editingShift.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/work-shifts', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (shift: WorkShiftItem) => {
    if (confirm(`Hapus jam shift kerja "${shift.name}"?`)) {
      router.delete(`/work-shifts/${shift.id}`);
    }
  };

  const shiftList = Array.isArray(shifts?.data) ? shifts.data : [];

  return (
    <DashboardLayout>
      <Head title="Jadwal Shift Kerja" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Jam Shift Kerja HR</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan jadwal jam masuk dan jam pulang operasional karyawan (Shift Pagi, Middle, Malam).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Buat Shift Jam
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama shift kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Shift Operasional</th>
              <th className="py-3.5 px-4">Cabang Penugasan</th>
              <th className="py-3.5 px-4">Jam Masuk</th>
              <th className="py-3.5 px-4">Jam Pulang</th>
              <th className="py-3.5 px-4">Tipe Shift</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {shiftList.length > 0 ? (
              shiftList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={15} className="text-indigo-600 shrink-0" />
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {s.branch ? (
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        [{s.branch.code}] {s.branch.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Semua Cabang (Global)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">{s.start_time.substring(0, 5)} WIB</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-600">{s.end_time.substring(0, 5)} WIB</td>
                  <td className="py-3 px-4">
                    {s.is_overnight ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Moon size={11} /> Shift Night / Lintas Hari
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Sun size={11} /> Shift Normal Daring
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(s)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada master shift kerja terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingShift ? 'Edit Shift Kerja' : 'Tambah Shift Kerja Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Cabang (Opsional)</label>
                <select
                  value={data.branch_id}
                  onChange={(e) => setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">- Berlaku Semua Cabang (Global) -</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Shift *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. Shift Pagi Kitchen / Shift Malam Bar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Masuk *</label>
                  <input
                    type="time"
                    value={data.start_time}
                    onChange={(e) => setData('start_time', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.start_time && <p className="text-[10px] text-rose-600 mt-1">{errors.start_time}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Pulang *</label>
                  <input
                    type="time"
                    value={data.end_time}
                    onChange={(e) => setData('end_time', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.end_time && <p className="text-[10px] text-rose-600 mt-1">{errors.end_time}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ws_is_overnight"
                  checked={data.is_overnight}
                  onChange={(e) => setData('is_overnight', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500"
                />
                <label htmlFor="ws_is_overnight" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Shift Lintas Hari / Shift Malam (Overnight)
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
                  <Save size={14} /> Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}