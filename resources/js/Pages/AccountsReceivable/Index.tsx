import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, X } from 'lucide-react';

interface Props { receivables: { data: any[] }; cashAccounts: any[] }

export default function AccountsReceivableIndex({ receivables, cashAccounts }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAr, setSelectedAr] = useState<any>(null);

  const settleForm = useForm({ settled_amount: 0, cash_account_id: '', settlement_date: new Date().toISOString().split('T')[0] });

  const handleOpenSettle = (ar: any) => {
    setSelectedAr(ar);
    settleForm.setData('settled_amount', ar.total_amount - ar.settled_amount);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    settleForm.post(`/accounts-receivable/${selectedAr.id}/settle`, { onSuccess: () => setIsModalOpen(false) });
  };

  return (
    <DashboardLayout>
      <Head title="Piutang Aggregator (AR)" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Piutang Aggregator (Accounts Receivable)</h1>
          <p className="text-xs text-slate-500 mt-1">Pencairan saldo tagihan penjualan dari platform GoFood, GrabFood, ShopeeFood, dan EDC Bank.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">No. Referensi</th><th className="py-3.5 px-4">Kanal Sales Mode</th><th className="py-3.5 px-4">Total Piutang</th><th className="py-3.5 px-4">Dicairkan</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {receivables.data.map((ar) => (
              <tr key={ar.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ar.reference_number}</td>
                <td className="py-3 px-4 font-bold">{ar.salesMode?.name}</td>
                <td className="py-3 px-4 font-mono font-bold">Rp {Number(ar.total_amount).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 font-mono text-emerald-600">Rp {Number(ar.settled_amount).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ar.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{ar.status}</span></td>
                <td className="py-3 px-4 text-right">
                  {ar.status !== 'SETTLED' && (
                    <button onClick={() => handleOpenSettle(ar)} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold"><CheckCircle2 size={12} className="inline mr-1" /> Cairkan Saldo</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Pencairan Dana Aggregator</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Masuk ke Akun Bank *</label><select value={settleForm.data.cash_account_id} onChange={(e) => settleForm.setData('cash_account_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg"><option value="">Pilih Akun Kas/Bank</option>{cashAccounts.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}</select></div>
              <div><label className="block text-xs font-semibold mb-1">Nominal Pencairan (Rp) *</label><input type="number" value={settleForm.data.settled_amount} onChange={(e) => settleForm.setData('settled_amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono font-bold text-emerald-600" /></div>
              <div><label className="block text-xs font-semibold mb-1">Tgl Transfer *</label><input type="date" value={settleForm.data.settlement_date} onChange={(e) => settleForm.setData('settlement_date', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium">Proses Pencairan</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}