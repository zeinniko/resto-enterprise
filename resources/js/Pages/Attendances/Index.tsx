import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, UserCheck, Search, Edit3, Trash2, Calendar, Clock, Save, Layers, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface EmployeeOption {
  id: number;
  name: string;
  employee_code?: string;
  nik?: string;
  branch_id: number;
  branch?: { id: number; name: string; code: string };
}

interface ShiftOption {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
}

interface AttendanceItem {
  id: number;
  employee_id: number;
  branch_id: number;
  work_shift_id?: number | null;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK';
  overtime_hours: number;
  notes?: string | null;
  employee?: EmployeeOption;
  work_shift?: ShiftOption;
}

interface Props {
  attendances?: { data: AttendanceItem[]; total: number };
  employees?: EmployeeOption[];
  shifts?: ShiftOption[];
  filters?: { search?: string; date?: string };
}

export default function AttendancesIndex({
  attendances = { data: [], total: 0 },
  employees = [],
  shifts = [],
  filters = {},
}: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [search, setSearch] = useState(filters.search || '');
  const [filterDate, setFilterDate] = useState(filters.date || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    employee_id: '' as string | number,
    work_shift_id: '' as string | number,
    date: today,
    clock_in: '08:00',
    clock_out: '17:00',
    status: 'PRESENT' as AttendanceItem['status'],
    overtime_hours: 0,
    notes: '',
  });

  const handleFilter = (searchVal: string, dateVal: string) => {
    router.get('/attendances', { search: searchVal, date: dateVal }, { preserveState: true });
  };

  const handleOpenModal = (item: AttendanceItem | null = null) => {
    clearErrors();
    setEditingAttendance(item);
    if (item) {
      setData({
        employee_id: item.employee_id,
        work_shift_id: item.work_shift_id || '',
        date: item.date ? item.date.substring(0, 10) : today,
        clock_in: item.clock_in ? item.clock_in.substring(11, 16) : '',
        clock_out: item.clock_out ? item.clock_out.substring(11, 16) : '',
        status: item.status,
        overtime_hours: Number(item.overtime_hours || 0),
        notes: item.notes || '',
      });
    } else {
      reset();
      setData('date', today);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAttendance) {
      put(`/attendances/${editingAttendance.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/attendances', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (item: AttendanceItem) => {
    if (confirm(`Hapus presensi ${item.employee?.name} tanggal ${item.date}?`)) {
      router.delete(`/attendances/${item.id}`);
    }
  };

  const attendanceList = Array.isArray(attendances?.data) ? attendances.data : [];

  const getStatusBadge = (status: AttendanceItem['status']) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={11} /> Hadir (Present)
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={11} /> Terlambat (Late)
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={11} /> Alpa (Absent)
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Sakit (Sick)
          </span>
        );
      case 'LEAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Izin / Cuti (Leave)
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <Head title="Presensi Karyawan" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Presensi & Kehadiran Karyawan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekap absensi harian, jam masuk/keluar, dan kalkulasi lembur tim restoran.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Catat Absensi
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); handleFilter(search, filterDate); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari NIK atau nama karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); handleFilter(search, e.target.value); }}
            className="w-full sm:w-44 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          {filterDate && (
            <button
              onClick={() => { setFilterDate(''); handleFilter(search, ''); }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tanggal Absensi</th>
              <th className="py-3.5 px-4">Karyawan</th>
              <th className="py-3.5 px-4">Shift Kerja</th>
              <th className="py-3.5 px-4">Clock In / Out</th>
              <th className="py-3.5 px-4">Status Kehadiran</th>
              <th className="py-3.5 px-4">Lembur (Jam)</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {attendanceList.length > 0 ? (
              attendanceList.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {a.date ? a.date.substring(0, 10) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck size={14} className="text-slate-400 shrink-0" />
                      <span>{a.employee?.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {a.employee?.employee_code || a.employee?.nik || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {a.work_shift ? a.work_shift.name : <span className="text-slate-400 italic">Default</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="text-emerald-700 font-bold">{a.clock_in ? a.clock_in.substring(11, 16) : '--:--'}</span>
                    {' - '}
                    <span className="text-rose-700 font-bold">{a.clock_out ? a.clock_out.substring(11, 16) : '--:--'}</span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(a.status)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {Number(a.overtime_hours)} Jam
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(a)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
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
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada catatan presensi terdaftar.
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
                {editingAttendance ? 'Edit Record Presensi' : 'Catat Presensi Karyawan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Karyawan *</label>
                <select
                  value={data.employee_id}
                  onChange={(e) => setData('employee_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      [{emp.employee_code || emp.nik}] {emp.name}
                    </option>
                  ))}
                </select>
                {errors.employee_id && <p className="text-[10px] text-rose-600 mt-1">{errors.employee_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Absensi *</label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.date && <p className="text-[10px] text-rose-600 mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Kerja</label>
                  <select
                    value={data.work_shift_id}
                    onChange={(e) => setData('work_shift_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">- Default Shift -</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time.substring(0, 5)}-{s.end_time.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clock In (Masuk)</label>
                  <input
                    type="time"
                    value={data.clock_in}
                    onChange={(e) => setData('clock_in', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clock Out (Pulang)</label>
                  <input
                    type="time"
                    value={data.clock_out}
                    onChange={(e) => setData('clock_out', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehadiran *</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value as AttendanceItem['status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PRESENT">PRESENT (Hadir Normal)</option>
                    <option value="LATE">LATE (Terlambat)</option>
                    <option value="ABSENT">ABSENT (Alpa / Tanpa Keterangan)</option>
                    <option value="SICK">SICK (Sakit)</option>
                    <option value="LEAVE">LEAVE (Izin / Cuti)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lembur (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={data.overtime_hours}
                    onChange={(e) => setData('overtime_hours', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan (Opsional)</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  placeholder="e.g. Terlambat 15 menit karena macet / lembur penyiapan event"
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                ></textarea>
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
                  <Save size={14} /> Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}