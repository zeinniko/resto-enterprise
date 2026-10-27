import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Coins } from 'lucide-react';

export default function ServiceChargesIndex({ records, branches }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    branch_id: '', period: new Date().toISOString().substring(0, 7), total_pool: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/service-charges', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Alokasi Service Charge" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alokasi Service Charge Resto</h1>
          <p className="text-xs text-slate-500 mt-1">Pembagian akumulasi poin service charge untuk staf bulanan.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Alokasikan Service Charge
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Periode</th>
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4 text-right">Total Pool (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {records?.data?.length > 0 ? (
              records.data.map((sc: any) => (
                <tr key={sc.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sc.period}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{sc.branch?.name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    Rp {Number(sc.total_pool).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">Belum ada alokasi service charge.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Pool Service Charge</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang *</label>
                <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Periode (YYYY-MM) *</label>
                  <input type="month" value={data.period} onChange={(e) => setData('period', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Total Pool (Rp) *</label>
                  <input type="number" value={data.total_pool} onChange={(e) => setData('total_pool', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
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