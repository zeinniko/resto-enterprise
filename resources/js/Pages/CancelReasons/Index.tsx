import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, AlertCircle } from 'lucide-react';

export default function CancelReasonsIndex({ reasons }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    reason: '', requires_approval: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/cancel-reasons', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Alasan Pembatalan (Void)" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alasan Pembatalan (Void/Cancel)</h1>
          <p className="text-xs text-slate-500 mt-1">Daftar standar alasan pembatalan item atau transaksi oleh kasir.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Alasan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Keterangan Alasan</th>
              <th className="py-3.5 px-4">Persetujuan Spv</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {reasons?.data?.length > 0 ? (
              reasons.data.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500" /> {r.reason}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.requires_approval ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {r.requires_approval ? 'Wajib Approval SPV' : 'Tanpa Approval'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={2} className="py-6 text-center text-slate-400">Belum ada alasan pembatalan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Tambah Alasan Pembatalan</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Alasan Void *</label>
                <input type="text" value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Pelanggan Batal Pesan" className="w-full px-3 py-2 text-xs border rounded-lg" />
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