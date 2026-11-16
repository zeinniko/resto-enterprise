import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, X, Trash2, Search, Eye, BookOpen, CheckCircle2, AlertCircle, RotateCcw
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface ChartOfAccount { id: number; code: string; name: string; type?: string; }
interface CostCenter { id: number; code?: string; name: string; }

interface JournalEntryItem {
  id: number;
  chart_of_account_id: number;
  cost_center_id?: number | null;
  debit: number | string;
  credit: number | string;
  chart_of_account?: ChartOfAccount;
  cost_center?: CostCenter | null;
}

interface Journal {
  id: number;
  journal_number: string;
  transaction_date: string;
  description: string;
  reference_type?: string | null;
  reference_id?: number | null;
  total_debit?: number | string | null;
  total_credit?: number | string | null;
  branch?: Branch;
  creator?: { id: number; name: string } | null;
  entries?: JournalEntryItem[];
}

interface Props {
  journals: {
    data: Journal[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  accounts: ChartOfAccount[];
  costCenters?: CostCenter[];
  hasCostCenter?: boolean;
  filters?: { search?: string; branch_id?: string; start_date?: string; end_date?: string };
}

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0];
};

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

const formatReferenceLabel = (refType?: string | null, refId?: number | null) => {
  if (!refType) return 'Manual Entry';
  const shortName = refType.split('\\').pop() || refType;
  return refId ? `${shortName} #${refId}` : shortName;
};

export default function JournalsIndex({
  journals,
  branches = [],
  accounts = [],
  costCenters = [],
  hasCostCenter = false,
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null);

  const generateJournalNumber = () => {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `JV-${yymmdd}-${rand}`;
  };

  const createForm = useForm({
    branch_id: '',
    journal_number: generateJournalNumber(),
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    items: [
      { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
      { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
    ],
  });

  const applyFilters = (overrides?: Partial<NonNullable<Props['filters']>>) => {
    router.get(
      '/journals',
      {
        search: overrides?.search ?? search,
        branch_id: overrides?.branch_id ?? selectedBranch,
        start_date: overrides?.start_date ?? startDate,
        end_date: overrides?.end_date ?? endDate,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBranch('');
    setStartDate('');
    setEndDate('');
    router.get('/journals', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedBranch || startDate || endDate);

  // Kalkulasi real-time Total Debit vs Credit
  const totals = useMemo(() => {
    const totalDebit = createForm.data.items.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = createForm.data.items.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = totalDebit > 0 && diff < 0.01;
    return { totalDebit, totalCredit, diff, isBalanced };
  }, [createForm.data.items]);

  const openCreateModal = () => {
    createForm.clearErrors();
    createForm.setData({
      branch_id: branches.length === 1 ? String(branches[0].id) : '',
      journal_number: generateJournalNumber(),
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      items: [
        { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
        { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    createForm.setData('items', [
      ...createForm.data.items,
      { chart_of_account_id: '', cost_center_id: '', debit: 0, credit: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (createForm.data.items.length <= 2) return;
    createForm.setData(
      'items',
      createForm.data.items.filter((_, i) => i !== index)
    );
  };

  const handleRowChange = (index: number, field: 'chart_of_account_id' | 'cost_center_id' | 'debit' | 'credit', value: string) => {
    const updated = [...createForm.data.items];
    if (field === 'debit') {
      const num = Math.max(0, parseFloat(value) || 0);
      updated[index] = { ...updated[index], debit: num, credit: num > 0 ? 0 : updated[index].credit };
    } else if (field === 'credit') {
      const num = Math.max(0, parseFloat(value) || 0);
      updated[index] = { ...updated[index], credit: num, debit: num > 0 ? 0 : updated[index].debit };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    createForm.setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/journals', {
      onSuccess: () => {
        setIsModalOpen(false);
        createForm.reset();
      },
    });
  };

  return (
    <DashboardLayout>
      <Head title="Jurnal Umum (General Journal)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jurnal Umum (General Journal)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan entri akuntansi ganda (Double-Entry Debit & Credit) manual maupun otomatis dari modul operasional.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Buat Jurnal Umum
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative w-full lg:w-72"
        >
          <input
            type="text"
            placeholder="Cari No. Jurnal atau Keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              applyFilters({ branch_id: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.code}] {b.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              applyFilters({ start_date: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
            title="Dari Tanggal"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              applyFilters({ end_date: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
            title="Sampai Tanggal"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Jurnal</th>
                <th className="py-3.5 px-4">Tgl Transaksi</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Deskripsi & Sumber</th>
                <th className="py-3.5 px-4 text-right">Total Debit</th>
                <th className="py-3.5 px-4 text-right">Total Credit</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {journals.data.length > 0 ? (
                journals.data.map((j) => {
                  const debit = Number(j.total_debit ?? j.entries?.reduce((s, e) => s + Number(e.debit || 0), 0) ?? 0);
                  const credit = Number(j.total_credit ?? j.entries?.reduce((s, e) => s + Number(e.credit || 0), 0) ?? 0);

                  return (
                    <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        <button onClick={() => setViewingJournal(j)} className="hover:underline text-left">
                          {j.journal_number}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono">{formatDateOnly(j.transaction_date)}</td>
                      <td className="py-3 px-4 font-semibold">{j.branch?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{j.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Sumber: {formatReferenceLabel(j.reference_type, j.reference_id)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatRupiah(debit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatRupiah(credit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingJournal(j)}
                          title="Lihat Ayat Jurnal"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada catatan jurnal umum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {journals.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{journals.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{journals.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{journals.total}</span> jurnal
            </div>
            <div className="flex flex-wrap gap-1">
              {journals.links.map((link, idx) => (
                <button
                  key={idx}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                    link.active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : link.url
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Input Jurnal Umum Double-Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Input Jurnal Umum Double-Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {(createForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{(createForm.errors as Record<string, string>).message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select
                    value={createForm.data.branch_id}
                    onChange={(e) => createForm.setData('branch_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.branch_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Jurnal *</label>
                  <input
                    type="text"
                    value={createForm.data.journal_number}
                    onChange={(e) => createForm.setData('journal_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                  {createForm.errors.journal_number && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.journal_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Transaksi *</label>
                  <input
                    type="date"
                    value={createForm.data.transaction_date}
                    onChange={(e) => createForm.setData('transaction_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {createForm.errors.transaction_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.transaction_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Jurnal *</label>
                <input
                  type="text"
                  value={createForm.data.description}
                  onChange={(e) => createForm.setData('description', e.target.value)}
                  placeholder="misal: Penyesuaian Beban Sewa Outlet Bulanan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
                {createForm.errors.description && (
                  <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.description}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800">Detail Baris Debit & Credit *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Baris Akun
                  </button>
                </div>

                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <select
                        value={row.chart_of_account_id}
                        onChange={(e) => handleRowChange(idx, 'chart_of_account_id', e.target.value)}
                        className="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Akun COA</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.code}] {a.name}
                          </option>
                        ))}
                      </select>

                      {hasCostCenter && costCenters.length > 0 && (
                        <select
                          value={row.cost_center_id}
                          onChange={(e) => handleRowChange(idx, 'cost_center_id', e.target.value)}
                          className="w-36 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="">Cost Center</option>
                          {costCenters.map((cc) => (
                            <option key={cc.id} value={cc.id}>
                              {cc.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Debit"
                          value={row.debit || ''}
                          onChange={(e) => handleRowChange(idx, 'debit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                        />
                      </div>

                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Credit"
                          value={row.credit || ''}
                          onChange={(e) => handleRowChange(idx, 'credit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                        />
                      </div>

                      {createForm.data.items.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Indikator Live Balance Debit vs Credit */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  totals.isBalanced
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/70 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {totals.isBalanced ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Jurnal Seimbang (Balanced)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} className="text-amber-600" />
                      <span>
                        {totals.totalDebit === 0 && totals.totalCredit === 0
                          ? 'Masukkan nominal Debit & Credit'
                          : `Belum Seimbang (Selisih: ${formatRupiah(totals.diff)})`}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <span>
                    Debit: <strong>{formatRupiah(totals.totalDebit)}</strong>
                  </span>
                  <span>
                    Credit: <strong>{formatRupiah(totals.totalCredit)}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing || !totals.isBalanced}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createForm.processing ? 'Memposting...' : 'Post Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Ayat Jurnal */}
      {viewingJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold font-mono text-slate-900">{viewingJournal.journal_number}</h2>
              </div>
              <button onClick={() => setViewingJournal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tgl Transaksi</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {formatDateOnly(viewingJournal.transaction_date)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingJournal.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Sumber</div>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {formatReferenceLabel(viewingJournal.reference_type, viewingJournal.reference_id)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Dibuat Oleh</div>
                  <div className="font-medium text-slate-700 mt-0.5">{viewingJournal.creator?.name || 'System'}</div>
                </div>
              </div>

              <div className="bg-slate-50/60 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-700">
                <span className="font-semibold text-slate-500 mr-1.5">Keterangan:</span>
                {viewingJournal.description}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Kode Akun</th>
                      <th className="py-2.5 px-3">Nama Akun (COA)</th>
                      <th className="py-2.5 px-3 text-right">Debit</th>
                      <th className="py-2.5 px-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingJournal.entries?.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          {entry.chart_of_account?.code}
                        </td>
                        <td className={`py-2.5 px-3 ${Number(entry.credit) > 0 ? 'pl-7 text-slate-600' : 'font-semibold text-slate-800'}`}>
                          {entry.chart_of_account?.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Number(entry.debit) > 0 ? formatRupiah(entry.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Number(entry.credit) > 0 ? formatRupiah(entry.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[10px] text-slate-500">
                        Total Seimbang
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatRupiah(
                          viewingJournal.total_debit ??
                            viewingJournal.entries?.reduce((s, e) => s + Number(e.debit || 0), 0)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatRupiah(
                          viewingJournal.total_credit ??
                            viewingJournal.entries?.reduce((s, e) => s + Number(e.credit || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewingJournal(null)}
                className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}