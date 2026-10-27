import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, Trash2 } from 'lucide-react';

interface Props {
  journals: { data: any[] };
  branches: any[];
  accounts: any[];
  costCenters: any[];
}

export default function JournalsIndex({ journals, branches, accounts, costCenters }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createForm = useForm({
    branch_id: '',
    journal_number: `JV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    description: '',
    items: [
      { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
      { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
    ],
  });

  const handleAddItem = () => {
    createForm.setData('items', [...createForm.data.items, { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/journals', { onSuccess: () => { setIsModalOpen(false); createForm.reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Jurnal Umum (General Journal)" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jurnal Umum (General Journal)</h1>
          <p className="text-xs text-slate-500 mt-1">Pencatatan transaksi keuangan ganda (Double-Entry Debit & Credit).</p>
        </div>
        <button onClick={() => { createForm.reset(); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"><Plus size={16} className="inline mr-1" /> Buat Jurnal</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">No. Jurnal</th><th className="py-3.5 px-4">Tgl</th><th className="py-3.5 px-4">Cabang</th><th className="py-3.5 px-4">Deskripsi / Keterangan</th><th className="py-3.5 px-4">Total Nominal</th><th className="py-3.5 px-4">Status</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {journals.data.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{j.journal_number}</td>
                <td className="py-3 px-4">{j.date}</td>
                <td className="py-3 px-4 font-semibold">{j.branch?.name}</td>
                <td className="py-3 px-4 text-slate-600">{j.description}</td>
                <td className="py-3 px-4 font-mono font-bold">Rp {Number(j.total_amount).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{j.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Input Jurnal Umum Double-Entry</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold mb-1">Cabang *</label><select value={createForm.data.branch_id} onChange={(e) => createForm.setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg"><option value="">Pilih Cabang</option>{branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold mb-1">No. Jurnal *</label><input type="text" value={createForm.data.journal_number} onChange={(e) => createForm.setData('journal_number', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" /></div>
                <div><label className="block text-xs font-semibold mb-1">Tgl Transaksi *</label><input type="date" value={createForm.data.date} onChange={(e) => createForm.setData('date', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              </div>
              <div><label className="block text-xs font-semibold mb-1">Keterangan Jurnal *</label><input type="text" value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} placeholder="misal: Penyesuaian Beban Sewa Bulanan" className="w-full px-3 py-2 text-xs border rounded-lg" /></div>

              <div>
                <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold">Detail Baris Debit & Credit *</label><button type="button" onClick={handleAddItem} className="text-[11px] font-semibold text-indigo-600">+ Tambah Baris</button></div>
                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select value={row.chart_of_account_id} onChange={(e) => {
                        const updated = [...createForm.data.items];
                        updated[idx].chart_of_account_id = e.target.value;
                        createForm.setData('items', updated);
                      }} className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Pilih Akun COA</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
                      </select>
                      <input type="number" placeholder="Debit" value={row.debit} onChange={(e) => {
                        const updated = [...createForm.data.items];
                        updated[idx].debit = parseFloat(e.target.value) || 0;
                        createForm.setData('items', updated);
                      }} className="w-28 px-2 py-1.5 text-xs bg-white border rounded-lg font-mono" />
                      <input type="number" placeholder="Credit" value={row.credit} onChange={(e) => {
                        const updated = [...createForm.data.items];
                        updated[idx].credit = parseFloat(e.target.value) || 0;
                        createForm.setData('items', updated);
                      }} className="w-28 px-2 py-1.5 text-xs bg-white border rounded-lg font-mono" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" disabled={createForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Post Jurnal</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}