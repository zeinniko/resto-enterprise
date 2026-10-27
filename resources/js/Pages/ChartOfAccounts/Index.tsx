import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit3, Trash2, X, BookOpen } from 'lucide-react';

interface Props {
  accounts: { data: any[]; total: number };
  filters: { search?: string; type?: string };
}

export default function ChartOfAccountsIndex({ accounts, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    code: '', name: '', type: 'ASSET', normal_balance: 'DEBIT', is_active: true,
  });

  const handleOpenModal = (account: any = null) => {
    setEditingAccount(account);
    if (account) {
      setData({ code: account.code, name: account.name, type: account.type, normal_balance: account.normal_balance, is_active: account.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      put(`/chart-of-accounts/${editingAccount.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/chart-of-accounts', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Chart of Accounts (COA)" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chart of Accounts (COA)</h1>
          <p className="text-xs text-slate-500 mt-1">Bagan akun standar akuntansi untuk pencatatan transaksi keuangan.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Akun COA
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode Akun</th>
              <th className="py-3.5 px-4">Nama Akun</th>
              <th className="py-3.5 px-4">Kategori Tipe</th>
              <th className="py-3.5 px-4">Saldo Normal</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {accounts.data.length > 0 ? (
              accounts.data.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{acc.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{acc.type}</span></td>
                  <td className="py-3 px-4 font-bold">{acc.normal_balance}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${acc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{acc.is_active ? 'Aktif' : 'Non-Aktif'}</span></td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(acc)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                    <button onClick={() => confirm('Hapus akun COA?') && router.delete(`/chart-of-accounts/${acc.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada Chart of Accounts.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Input Akun COA</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Kode Akun *</label><input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="1110" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" /></div>
              <div><label className="block text-xs font-semibold mb-1">Nama Akun *</label><input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Kas Utama / Bank BCA" className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipe Akun *</label>
                  <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Saldo Normal *</label>
                  <select value={data.normal_balance} onChange={(e) => setData('normal_balance', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}