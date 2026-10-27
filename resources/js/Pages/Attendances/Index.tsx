import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, UserCheck } from 'lucide-react';

export default function AttendancesIndex({ attendances, employees }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    employee_id: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/attendances', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Presensi Karyawan" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Presensi & Kehadiran Karyawan</h1>
          <p className="text-xs text-slate-500 mt-1">Rekap absensi harian staff dan tim restoran.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Catat Absensi
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Karyawan</th>
              <th className="py-3.5 px-4">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {attendances?.data?.length > 0 ? (
              attendances.data.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono">{a.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{a.employee?.name} ({a.employee?.nik})</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                      a.status === 'LATE' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">Belum ada catatan presensi.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Catat Presensi</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Karyawan *</label>
                <select value={data.employee_id} onChange={(e) => setData('employee_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((emp: any) => <option key={emp.id} value={emp.id}>[{emp.nik}] {emp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tanggal *</label>
                  <input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status *</label>
                  <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="PRESENT">Hadir (Present)</option>
                    <option value="LATE">Terlambat (Late)</option>
                    <option value="ABSENT">Alpa (Absent)</option>
                    <option value="LEAVE">Izin/Cuti (Leave)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}