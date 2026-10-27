import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Clock, DollarSign, X } from 'lucide-react';

interface Props { shifts: { data: any[] }; branches: any[] }

export default function ShiftsIndex({ shifts, branches }: Props) {
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const openShiftForm = useForm({ branch_id: '', initial_cash: 500000 });
  const closeShiftForm = useForm({ final_cash_actual: 0 });

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openShiftForm.post('/shifts', { onSuccess: () => setIsOpenModalOpen(false) });
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeShiftForm.post(`/shifts/${selectedShift.id}/close`, { onSuccess: () => setIsCloseModalOpen(false) });
  };

  return (
    <DashboardLayout>
      <Head title="Shift Register Kasir" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shift Register Kasir POS</h1>
          <p className="text-xs text-slate-500 mt-1">Pembukaan kas awal (modal laci) dan penutupan audit setoran kasir harian.</p>
        </div>
        <button onClick={() => setIsOpenModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"><Plus size={16} className="inline mr-1" /> Buka Shift Kasir Baru</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">Petugas Kasir</th><th className="py-3.5 px-4">Cabang</th><th className="py-3.5 px-4">Waktu Buka / Tutup</th><th className="py-3.5 px-4">Kas Awal</th><th className="py-3.5 px-4">Setoran Kasir</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {shifts.data.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">{s.user?.name || 'Kasir POS'}</td>
                <td className="py-3 px-4 font-semibold">{s.branch?.name}</td>
                <td className="py-3 px-4 text-slate-500">{new Date(s.start_time).toLocaleTimeString('id-ID')} {s.end_time ? `- ${new Date(s.end_time).toLocaleTimeString('id-ID')}` : ''}</td>
                <td className="py-3 px-4 font-mono">Rp {Number(s.initial_cash).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 font-mono font-bold">{s.final_cash_actual ? `Rp ${Number(s.final_cash_actual).toLocaleString('id-ID')}` : '-'}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                <td className="py-3 px-4 text-right">
                  {s.status === 'OPEN' && (
                    <button onClick={() => { setSelectedShift(s); setIsCloseModalOpen(true); }} className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[11px] font-bold">Tutup Shift Kasir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Buka Shift */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Buka Shift Kasir Baru</h2><button onClick={() => setIsOpenModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang *</label>
                <select value={openShiftForm.data.branch_id} onChange={(e) => openShiftForm.setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Modal Kas Awal Laci (Rp) *</label>
                <input type="number" min="0" value={openShiftForm.data.initial_cash} onChange={(e) => openShiftForm.setData('initial_cash', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono font-bold text-indigo-600" />
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsOpenModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Buka Shift</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Tutup Shift Kasir</h2><button onClick={() => setIsCloseModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleCloseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Total Setoran Kas Fisik Aktual (Rp) *</label>
                <input type="number" min="0" value={closeShiftForm.data.final_cash_actual} onChange={(e) => closeShiftForm.setData('final_cash_actual', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono font-bold text-rose-600" />
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsCloseModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-medium">Tutup Shift & Kunci Register</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}