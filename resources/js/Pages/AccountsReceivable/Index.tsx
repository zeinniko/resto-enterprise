import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  CheckCircle2, X, Search, RotateCcw, Eye, AlertTriangle, Clock, Plus, FileText
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface AccountOption { id: number; code: string; name: string; }

interface JournalEntry {
  id: number;
  debit: number | string;
  credit: number | string;
  chart_of_account?: { id: number; code: string; name: string };
}

interface SettlementJournal {
  id: number;
  journal_number: string;
  transaction_date: string;
  description: string;
  creator?: { id: number; name: string } | null;
  entries?: JournalEntry[];
}

interface AccountsReceivable {
  id: number;
  branch_id: number;
  partner_name: string;
  total_amount: number | string;
  received_amount: number | string;
  due_date?: string | null;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  created_at?: string;
  branch?: Branch;
  journals?: SettlementJournal[];
}

interface Props {
  receivables: {
    data: AccountsReceivable[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  cashAccounts: AccountOption[];
  expenseAccounts?: AccountOption[];
  branches?: Branch[];
  summary?: {
    unsettled_remaining: number;
    overdue_remaining: number;
    total_received: number;
  };
  filters?: { search?: string; status?: string; branch_id?: string };
}

const PARTNER_SUGGESTIONS = ['GoFood', 'GrabFood', 'ShopeeFood', 'QRIS / EDC BCA', 'EDC Mandiri', 'Traveloka Eats'];

const STATUS_BADGE: Record<AccountsReceivable['status'], string> = {
  UNPAID: 'bg-amber-50 text-amber-700 border-amber-200',
  PARTIAL: 'bg-sky-50 text-sky-700 border-sky-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0];
};

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

const formatRefCode = (id: number) => `AR-${String(id).padStart(5, '0')}`;

const isOverdue = (dueDate: string | null | undefined, status: AccountsReceivable['status']) => {
  if (status === 'PAID' || !dueDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return formatDateOnly(dueDate) < today;
};

export default function AccountsReceivableIndex({
  receivables,
  cashAccounts = [],
  expenseAccounts = [],
  branches = [],
  summary = { unsettled_remaining: 0, overdue_remaining: 0, total_received: 0 },
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');

  const [selectedAr, setSelectedAr] = useState<AccountsReceivable | null>(null);
  const [viewingAr, setViewingAr] = useState<AccountsReceivable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const settleForm = useForm({
    settled_amount: 0,
    admin_fee: 0,
    fee_account_id: '',
    cash_account_id: '',
    settlement_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const createForm = useForm({
    branch_id: '',
    partner_name: 'GoFood',
    total_amount: '' as number | string,
    due_date: '',
  });

  const applyFilters = (overrides?: Partial<NonNullable<Props['filters']>>) => {
    router.get(
      '/accounts-receivable',
      {
        search: overrides?.search ?? search,
        status: overrides?.status ?? selectedStatus,
        branch_id: overrides?.branch_id ?? selectedBranch,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedBranch('');
    router.get('/accounts-receivable', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedBranch);

  const handleOpenSettle = (ar: AccountsReceivable) => {
    settleForm.clearErrors();
    const remaining = Math.max(0, Number(ar.total_amount) - Number(ar.received_amount));
    settleForm.setData({
      settled_amount: remaining,
      admin_fee: 0,
      fee_account_id: expenseAccounts[0] ? String(expenseAccounts[0].id) : '',
      cash_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
      settlement_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedAr(ar);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAr) return;
    settleForm.post(`/accounts-receivable/${selectedAr.id}/settle`, {
      onSuccess: () => {
        setSelectedAr(null);
        setViewingAr(null);
        settleForm.reset();
      },
    });
  };

  const handleOpenCreate = () => {
    createForm.clearErrors();
    createForm.setData({
      branch_id: branches.length === 1 ? String(branches[0].id) : '',
      partner_name: 'GoFood',
      total_amount: '',
      due_date: '',
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/accounts-receivable', {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
    });
  };

  const remainingForSelected = selectedAr
    ? Math.max(0, Number(selectedAr.total_amount) - Number(selectedAr.received_amount))
    : 0;

  return (
    <DashboardLayout>
      <Head title="Piutang Aggregator (AR)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Piutang Aggregator & EDC (Accounts Receivable)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan & pencairan saldo penjualan dari GoFood, GrabFood, ShopeeFood, QRIS, dan EDC Bank ke rekening.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Catat Piutang Manual
        </button>
      </div>

      {/* Ringkasan KPI Piutang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Saldo Belum Dicairkan</div>
            <div className="text-lg font-mono font-bold text-slate-900 mt-1">
              {formatRupiah(summary.unsettled_remaining)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Lewat Estimasi Cair (Overdue)</div>
            <div className="text-lg font-mono font-bold text-rose-600 mt-1">
              {formatRupiah(summary.overdue_remaining)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Sudah Cair ke Bank</div>
            <div className="text-lg font-mono font-bold text-emerald-600 mt-1">
              {formatRupiah(summary.total_received)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative w-full lg:w-80"
        >
          <input
            type="text"
            placeholder="Cari Partner (GoFood, EDC) atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {branches.length > 0 && (
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
          )}

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="UNPAID">UNPAID (Belum Cair)</option>
            <option value="PARTIAL">PARTIAL (Cair Sebagian)</option>
            <option value="OVERDUE">OVERDUE (Lewat Jatuh Tempo)</option>
            <option value="PAID">PAID (Cair Penuh)</option>
          </select>

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
                <th className="py-3.5 px-4">No. Ref</th>
                <th className="py-3.5 px-4">Partner / Kanal & Cabang</th>
                <th className="py-3.5 px-4">Estimasi Cair</th>
                <th className="py-3.5 px-4 text-right">Total Piutang</th>
                <th className="py-3.5 px-4 text-right">Sudah Cair</th>
                <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {receivables.data.length > 0 ? (
                receivables.data.map((ar) => {
                  const remaining = Math.max(0, Number(ar.total_amount) - Number(ar.received_amount));
                  const overdue = isOverdue(ar.due_date, ar.status);

                  return (
                    <tr key={ar.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        <button onClick={() => setViewingAr(ar)} className="hover:underline text-left">
                          {formatRefCode(ar.id)}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ar.partner_name}</div>
                        <div className="text-[10px] text-slate-400">{ar.branch?.name || '-'}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold ${
                            overdue ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          {formatDateOnly(ar.due_date)}
                        </span>
                        {overdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatRupiah(ar.total_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatRupiah(ar.received_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(remaining)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            STATUS_BADGE[ar.status] || STATUS_BADGE.UNPAID
                          }`}
                        >
                          {ar.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingAr(ar)}
                            title="Detail & Riwayat Pencairan"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Eye size={14} />
                          </button>

                          {ar.status !== 'PAID' && (
                            <button
                              onClick={() => handleOpenSettle(ar)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-sm transition-colors"
                            >
                              <CheckCircle2 size={12} /> Cairkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Belum ada catatan piutang aggregator / EDC.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {receivables.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{receivables.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{receivables.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{receivables.total}</span> piutang
            </div>
            <div className="flex flex-wrap gap-1">
              {receivables.links.map((link, idx) => (
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

      {/* Modal Pencairan Dana Aggregator */}
      {selectedAr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pencairan Dana Aggregator / EDC</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedAr.partner_name} — <span className="font-mono">{formatRefCode(selectedAr.id)}</span>
                </p>
              </div>
              <button onClick={() => setSelectedAr(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Total Piutang:</span>
                  <span className="font-mono font-semibold">{formatRupiah(selectedAr.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sudah Dicairkan:</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(selectedAr.received_amount)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Sisa Saldo Mengendap:</span>
                  <span className="font-mono text-indigo-600">{formatRupiah(remainingForSelected)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Masuk ke Akun Kas / Bank *</label>
                <select
                  value={settleForm.data.cash_account_id}
                  onChange={(e) => settleForm.setData('cash_account_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Akun Kas/Bank</option>
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
                {settleForm.errors.cash_account_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{settleForm.errors.cash_account_id}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Nominal Bersih Masuk Bank (Rp) *</label>
                  <button
                    type="button"
                    onClick={() =>
                      settleForm.setData(
                        'settled_amount',
                        Math.max(0, remainingForSelected - (Number(settleForm.data.admin_fee) || 0))
                      )
                    }
                    className="text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    Cairkan Sisa Penuh
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={remainingForSelected}
                  step="any"
                  value={settleForm.data.settled_amount}
                  onChange={(e) => settleForm.setData('settled_amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-600 text-right"
                />
                {settleForm.errors.settled_amount && (
                  <p className="text-[11px] text-rose-600 mt-1">{settleForm.errors.settled_amount}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potongan MDR / Admin (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={settleForm.data.admin_fee}
                    onChange={(e) => settleForm.setData('admin_fee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-right"
                  />
                  {settleForm.errors.admin_fee && (
                    <p className="text-[11px] text-rose-600 mt-1">{settleForm.errors.admin_fee}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Cair *</label>
                  <input
                    type="date"
                    value={settleForm.data.settlement_date}
                    onChange={(e) => settleForm.setData('settlement_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {settleForm.errors.settlement_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{settleForm.errors.settlement_date}</p>
                  )}
                </div>
              </div>

              {Number(settleForm.data.admin_fee) > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Akun Beban MDR / Admin *</label>
                  <select
                    value={settleForm.data.fee_account_id}
                    onChange={(e) => settleForm.setData('fee_account_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Akun Beban</option>
                    {expenseAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        [{acc.code}] {acc.name}
                      </option>
                    ))}
                  </select>
                  {settleForm.errors.fee_account_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{settleForm.errors.fee_account_id}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Settlement (Opsional)</label>
                <input
                  type="text"
                  placeholder="misal: Settlement GoBiz Batch #14"
                  value={settleForm.data.notes}
                  onChange={(e) => settleForm.setData('notes', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAr(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={settleForm.processing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {settleForm.processing ? 'Memproses...' : 'Proses Pencairan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Pencairan */}
      {viewingAr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold font-mono text-slate-900">{formatRefCode(viewingAr.id)}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    STATUS_BADGE[viewingAr.status]
                  }`}
                >
                  {viewingAr.status}
                </span>
              </div>
              <button onClick={() => setViewingAr(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Partner / Kanal</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAr.partner_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAr.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Cair</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {formatDateOnly(viewingAr.due_date)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Sisa Piutang</div>
                  <div className="font-mono font-bold text-amber-600 mt-0.5">
                    {formatRupiah(Math.max(0, Number(viewingAr.total_amount) - Number(viewingAr.received_amount)))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">Riwayat Jurnal Pencairan</h3>
                {viewingAr.journals && viewingAr.journals.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">No. Jurnal</th>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">Keterangan / Akun Masuk</th>
                          <th className="py-2 px-3 text-right">Piutang Cair</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingAr.journals.map((j) => {
                          const creditAr = j.entries?.find((e) => Number(e.credit) > 0);
                          return (
                            <tr key={j.id}>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-600">
                                {j.journal_number}
                              </td>
                              <td className="py-2 px-3 font-mono">{formatDateOnly(j.transaction_date)}</td>
                              <td className="py-2 px-3">{j.description}</td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600">
                                {formatRupiah(creditAr?.credit ?? 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Belum ada riwayat pencairan dana untuk piutang ini.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
              {viewingAr.status !== 'PAID' && (
                <button
                  onClick={() => handleOpenSettle(viewingAr)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <CheckCircle2 size={13} /> Cairkan Saldo
                </button>
              )}
              <button
                onClick={() => setViewingAr(null)}
                className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Piutang Manual */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Catat Piutang Aggregator / EDC</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cabang *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Partner / Kanal *</label>
                <input
                  type="text"
                  list="partner-suggestions"
                  value={createForm.data.partner_name}
                  onChange={(e) => createForm.setData('partner_name', e.target.value)}
                  placeholder="misal: GoFood, GrabFood, EDC BCA"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
                <datalist id="partner-suggestions">
                  {PARTNER_SUGGESTIONS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                {createForm.errors.partner_name && (
                  <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.partner_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal Piutang (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0"
                    value={createForm.data.total_amount}
                    onChange={(e) => createForm.setData('total_amount', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-right"
                  />
                  {createForm.errors.total_amount && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.total_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Tgl Cair</label>
                  <input
                    type="date"
                    value={createForm.data.due_date}
                    onChange={(e) => createForm.setData('due_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {createForm.errors.due_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.due_date}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan Piutang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}