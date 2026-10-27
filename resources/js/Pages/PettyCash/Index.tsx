import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Landmark, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function PettyCashIndex({ records, branches }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    branch_id: '', type: 'OUT', amount: 0, description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/petty-cash', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Kas Kecil (Petty Cash)" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kas Kecil (Petty Cash)</h1>
          <p className="text-xs text-slate-500 mt-1">Pencatatan pengeluaran operasional mendesak dan isi ulang kas kecil.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Catat Transaksi Kas
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">Tipe</th>
              <th className="py-3.5 px-4">Keterangan</th>
              <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {records?.data?.length > 0 ? (
              records.data.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.branch?.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${r.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {r.type === 'IN' ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                      {r.type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{r.description}</td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${r.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    Rp {Number(r.amount).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">Belum ada transaksi kas kecil.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Transaksi Kas Kecil</h2>
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
                  <label className="block text-xs font-semibold mb-1">Tipe Transaksi *</label>
                  <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="IN">Isi Ulang (IN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nominal (Rp) *</label>
                  <input type="number" value={data.amount} onChange={(e) => setData('amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Keterangan *</label>
                <input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Beli Es Batu Opsional" className="w-full px-3 py-2 text-xs border rounded-lg" />
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