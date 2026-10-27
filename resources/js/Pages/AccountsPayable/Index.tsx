import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, X } from 'lucide-react';

interface Props { payables: { data: any[] }; cashAccounts: any[] }

export default function AccountsPayableIndex({ payables, cashAccounts }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAp, setSelectedAp] = useState<any>(null);

  const payForm = useForm({ payment_amount: 0, cash_account_id: '', payment_date: new Date().toISOString().split('T')[0] });

  const handleOpenPay = (ap: any) => {
    setSelectedAp(ap);
    payForm.setData('payment_amount', ap.total_amount - ap.paid_amount);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    payForm.post(`/accounts-payable/${selectedAp.id}/pay`, { onSuccess: () => setIsModalOpen(false) });
  };

  return (
    <DashboardLayout>
      <Head title="Hutang Supplier (AP)" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hutang Supplier (Accounts Payable)</h1>
          <p className="text-xs text-slate-500 mt-1">Daftar kewajiban pembayaran tagihan atas penerimaan barang PO dari supplier.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">No. Invoice</th><th className="py-3.5 px-4">Supplier</th><th className="py-3.5 px-4">Jatuh Tempo</th><th className="py-3.5 px-4">Total Hutang</th><th className="py-3.5 px-4">Terbayar</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {payables.data.map((ap) => (
              <tr key={ap.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ap.invoice_number}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{ap.supplier?.name}</td>
                <td className="py-3 px-4 text-amber-700 font-semibold">{ap.due_date}</td>
                <td className="py-3 px-4 font-mono font-bold">Rp {Number(ap.total_amount).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 font-mono text-emerald-600">Rp {Number(ap.paid_amount).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ap.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{ap.status}</span></td>
                <td className="py-3 px-4 text-right">
                  {ap.status !== 'PAID' && (
                    <button onClick={() => handleOpenPay(ap)} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold"><CreditCard size={12} className="inline mr-1" /> Bayar</button>
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
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Bayar Tagihan Supplier</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Pilih Sumber Kas / Bank *</label><select value={payForm.data.cash_account_id} onChange={(e) => payForm.setData('cash_account_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg"><option value="">Pilih Akun Kas/Bank</option>{cashAccounts.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}</select></div>
              <div><label className="block text-xs font-semibold mb-1">Nominal Pembayaran (Rp) *</label><input type="number" value={payForm.data.payment_amount} onChange={(e) => payForm.setData('payment_amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono font-bold text-indigo-600" /></div>
              <div><label className="block text-xs font-semibold mb-1">Tgl Pembayaran *</label><input type="date" value={payForm.data.payment_date} onChange={(e) => payForm.setData('payment_date', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Proses Bayar</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}