import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Clock } from 'lucide-react';

export default function WorkShiftsIndex({ shifts }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    name: '', start_time: '08:00', end_time: '16:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/work-shifts', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Jadwal Shift Kerja" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Master Jam Shift Kerja</h1>
          <p className="text-xs text-slate-500 mt-1">Pengaturan jam masuk dan jam pulang karyawan (Pagi, Siang, Malam).</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Buat Shift Jam
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Nama Shift</th>
              <th className="py-3.5 px-4">Jam Masuk</th>
              <th className="py-3.5 px-4">Jam Pulang</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {shifts?.data?.length > 0 ? (
              shifts.data.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={15} className="text-indigo-600" /> {s.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">{s.start_time}</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-600">{s.end_time}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">Belum ada master shift kerja.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Tambah Shift Kerja</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Shift *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Shift Pagi Kitchen" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Masuk *</label>
                  <input type="time" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Pulang *</label>
                  <input type="time" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
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