import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Edit3, Trash2, X, BookOpen, Save, Layers, Filter } from 'lucide-react';

interface AccountItem {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'COGS';
  parent_id?: number | null;
  parent?: { id: number; code: string; name: string };
  is_active: boolean;
}

interface ParentOption {
  id: number;
  code: string;
  name: string;
}

interface Props {
  accounts?: { data: AccountItem[]; total: number };
  parentAccounts?: ParentOption[];
  filters?: { search?: string; type?: string };
}

export default function ChartOfAccountsIndex({
  accounts = { data: [], total: 0 },
  parentAccounts = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(filters.type || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    type: 'ASSET' as AccountItem['type'],
    parent_id: '' as string | number,
    is_active: true,
  });

  const handleFilter = (searchQuery: string, typeQuery: string) => {
    router.get('/chart-of-accounts', { search: searchQuery, type: typeQuery }, { preserveState: true });
  };

  const handleOpenModal = (account: AccountItem | null = null) => {
    clearErrors();
    setEditingAccount(account);
    if (account) {
      setData({
        code: account.code,
        name: account.name,
        type: account.type,
        parent_id: account.parent_id || '',
        is_active: Boolean(account.is_active),
      });
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

  const handleDelete = (account: AccountItem) => {
    if (confirm(`Hapus akun COA "${account.code} - ${account.name}"?`)) {
      router.delete(`/chart-of-accounts/${account.id}`);
    }
  };

  const getNormalBalance = (type: string) => {
    return ['ASSET', 'EXPENSE', 'COGS'].includes(type) ? 'DEBIT' : 'CREDIT';
  };

  const accountsList = Array.isArray(accounts?.data) ? accounts.data : [];

  return (
    <DashboardLayout>
      <Head title="Chart of Accounts (COA)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts (COA)</h1>
          <p className="text-xs text-slate-500 mt-1">Bagan akun standar akuntansi untuk pencatatan transaksi keuangan resto.</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Akun COA
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); handleFilter(search, selectedTypeFilter); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => { setSelectedTypeFilter(e.target.value); handleFilter(search, e.target.value); }}
            className="w-full sm:w-48 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Semua Tipe Akun</option>
            <option value="ASSET">ASSET (Aset / Aktiva)</option>
            <option value="LIABILITY">LIABILITY (Kewajiban)</option>
            <option value="EQUITY">EQUITY (Modal)</option>
            <option value="REVENUE">REVENUE (Pendapatan)</option>
            <option value="COGS">COGS (HPP Makanan/Minuman)</option>
            <option value="EXPENSE">EXPENSE (Beban Operasional)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode Akun</th>
              <th className="py-3.5 px-4">Nama Akun</th>
              <th className="py-3.5 px-4">Akun Induk (Header)</th>
              <th className="py-3.5 px-4">Kategori Tipe</th>
              <th className="py-3.5 px-4">Saldo Normal</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {accountsList.length > 0 ? (
              accountsList.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{acc.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-400 shrink-0" />
                    <span>{acc.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {acc.parent ? `[${acc.parent.code}] ${acc.parent.name}` : '- (Header Parent)'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-[10px] text-slate-700 uppercase">
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold font-mono">
                    <span className={getNormalBalance(acc.type) === 'DEBIT' ? 'text-emerald-700' : 'text-indigo-700'}>
                      {getNormalBalance(acc.type)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${acc.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {acc.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(acc)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(acc)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada Chart of Accounts terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingAccount ? 'Edit Akun COA' : 'Input Akun COA Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Akun *</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value)}
                  placeholder="e.g. 1101 / 5101"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.code && <p className="text-[10px] text-rose-600 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Akun *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. Kas Kasir POS / HPP Bahan Baku Makanan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Akun *</label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ASSET">ASSET (Aset / Aktiva Kas & Bank)</option>
                  <option value="LIABILITY">LIABILITY (Kewajiban / Hutang Usaha)</option>
                  <option value="EQUITY">EQUITY (Modal Usaha)</option>
                  <option value="REVENUE">REVENUE (Pendapatan Penjualan Resto)</option>
                  <option value="COGS">COGS (Harga Pokok Penjualan / HPP)</option>
                  <option value="EXPENSE">EXPENSE (Beban Operasional & Gaji)</option>
                </select>
                {errors.type && <p className="text-[10px] text-rose-600 mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Akun Induk / Header (Opsional)</label>
                <select
                  value={data.parent_id}
                  onChange={(e) => setData('parent_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">- Tanpa Induk (Akun Utama) -</option>
                  {parentAccounts.map((p) => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                  ))}
                </select>
                {errors.parent_id && <p className="text-[10px] text-rose-600 mt-1">{errors.parent_id}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coa_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500"
                />
                <label htmlFor="coa_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Akun Aktif (Dapat Digunakan Jurnal)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm"
                >
                  <Save size={14} /> Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}