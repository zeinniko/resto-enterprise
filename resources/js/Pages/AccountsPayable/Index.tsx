import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  CreditCard, X, Search, RotateCcw, Eye, AlertTriangle, CheckCircle2, Clock, FileText
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface CashAccount { id: number; code: string; name: string; }

interface JournalEntry {
  id: number;
  debit: number | string;
  credit: number | string;
  chart_of_account?: { id: number; code: string; name: string };
}

interface PaymentJournal {
  id: number;
  journal_number: string;
  transaction_date: string;
  description: string;
  creator?: { id: number; name: string } | null;
  entries?: JournalEntry[];
}

interface AccountsPayable {
  id: number;
  invoice_number: string;
  total_amount: number | string;
  paid_amount: number | string;
  due_date: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  branch?: Branch;
  supplier?: { id: number; name: string };
  purchase_order?: { id: number; po_number?: string; code?: string } | null;
  journals?: PaymentJournal[];
}

interface Props {
  payables: {
    data: AccountsPayable[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  cashAccounts: CashAccount[];
  branches?: Branch[];
  summary?: {
    unpaid_remaining: number;
    overdue_remaining: number;
    total_paid: number;
  };
  filters?: { search?: string; status?: string; branch_id?: string };
}

const STATUS_BADGE: Record<AccountsPayable['status'], string> = {
  UNPAID: 'bg-rose-50 text-rose-700 border-rose-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0];
};

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

const isOverdue = (dueDate: string, status: AccountsPayable['status']) => {
  if (status === 'PAID' || !dueDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return formatDateOnly(dueDate) < today;
};

export default function AccountsPayableIndex({
  payables,
  cashAccounts = [],
  branches = [],
  summary = { unpaid_remaining: 0, overdue_remaining: 0, total_paid: 0 },
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');

  const [selectedAp, setSelectedAp] = useState<AccountsPayable | null>(null);
  const [viewingAp, setViewingAp] = useState<AccountsPayable | null>(null);

  const payForm = useForm({
    payment_amount: 0,
    cash_account_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const applyFilters = (overrides?: Partial<NonNullable<Props['filters']>>) => {
    router.get(
      '/accounts-payable',
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
    router.get('/accounts-payable', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedBranch);

  const handleOpenPay = (ap: AccountsPayable) => {
    payForm.clearErrors();
    const remaining = Math.max(0, Number(ap.total_amount) - Number(ap.paid_amount));
    payForm.setData({
      payment_amount: remaining,
      cash_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedAp(ap);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAp) return;
    payForm.post(`/accounts-payable/${selectedAp.id}/pay`, {
      onSuccess: () => {
        setSelectedAp(null);
        setViewingAp(null);
        payForm.reset();
      },
    });
  };

  const remainingForSelected = selectedAp
    ? Math.max(0, Number(selectedAp.total_amount) - Number(selectedAp.paid_amount))
    : 0;

  return (
    <DashboardLayout>
      <Head title="Hutang Supplier (AP)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hutang Supplier (Accounts Payable)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar kewajiban tagihan atas penerimaan barang PO supplier, pemantauan jatuh tempo, dan jurnal pelunasan.
          </p>
        </div>
      </div>

      {/* Ringkasan KPI Hutang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Sisa Hutang Belum Lunas</div>
            <div className="text-lg font-mono font-bold text-slate-900 mt-1">
              {formatRupiah(summary.unpaid_remaining)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Lewat Jatuh Tempo (Overdue)</div>
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
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Sudah Dibayarkan</div>
            <div className="text-lg font-mono font-bold text-emerald-600 mt-1">
              {formatRupiah(summary.total_paid)}
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
            placeholder="Cari No. Invoice atau Nama Supplier..."
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
            <option value="UNPAID">UNPAID (Belum Bayar)</option>
            <option value="PARTIAL">PARTIAL (Cicilan)</option>
            <option value="OVERDUE">OVERDUE (Lewat Tempo)</option>
            <option value="PAID">PAID (Lunas)</option>
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
                <th className="py-3.5 px-4">No. Invoice</th>
                <th className="py-3.5 px-4">Supplier & Cabang</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-right">Terbayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Hutang</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payables.data.length > 0 ? (
                payables.data.map((ap) => {
                  const remaining = Math.max(0, Number(ap.total_amount) - Number(ap.paid_amount));
                  const overdue = isOverdue(ap.due_date, ap.status);

                  return (
                    <tr key={ap.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setViewingAp(ap)}
                          className="font-mono font-bold text-indigo-600 hover:underline text-left"
                        >
                          {ap.invoice_number}
                        </button>
                        {ap.purchase_order && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ref PO: {ap.purchase_order.po_number || ap.purchase_order.code || `#${ap.purchase_order.id}`}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{ap.supplier?.name || '-'}</div>
                        <div className="text-[10px] text-slate-400">{ap.branch?.name || '-'}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold ${
                            overdue ? 'text-rose-600' : ap.status === 'PAID' ? 'text-slate-500' : 'text-amber-700'
                          }`}
                        >
                          {formatDateOnly(ap.due_date)}
                        </span>
                        {overdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatRupiah(ap.total_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatRupiah(ap.paid_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(remaining)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            STATUS_BADGE[ap.status] || STATUS_BADGE.UNPAID
                          }`}
                        >
                          {ap.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingAp(ap)}
                            title="Detail & Riwayat Pembayaran"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Eye size={14} />
                          </button>

                          {ap.status !== 'PAID' && (
                            <button
                              onClick={() => handleOpenPay(ap)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-sm transition-colors"
                            >
                              <CreditCard size={12} /> Bayar
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
                    Tidak ada data tagihan hutang supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payables.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{payables.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{payables.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{payables.total}</span> tagihan
            </div>
            <div className="flex flex-wrap gap-1">
              {payables.links.map((link, idx) => (
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

      {/* Modal Bayar Tagihan Supplier */}
      {selectedAp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bayar Tagihan Supplier</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedAp.supplier?.name} — <span className="font-mono">{selectedAp.invoice_number}</span>
                </p>
              </div>
              <button onClick={() => setSelectedAp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Total Tagihan:</span>
                  <span className="font-mono font-semibold">{formatRupiah(selectedAp.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sudah Dibayar:</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(selectedAp.paid_amount)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Sisa Kewajiban:</span>
                  <span className="font-mono text-indigo-600">{formatRupiah(remainingForSelected)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Akun Kas / Bank *</label>
                <select
                  value={payForm.data.cash_account_id}
                  onChange={(e) => payForm.setData('cash_account_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Akun Kas/Bank</option>
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
                {payForm.errors.cash_account_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{payForm.errors.cash_account_id}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Nominal Pembayaran (Rp) *</label>
                  <button
                    type="button"
                    onClick={() => payForm.setData('payment_amount', remainingForSelected)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Lunasi Semua
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={remainingForSelected}
                  step="any"
                  value={payForm.data.payment_amount}
                  onChange={(e) => payForm.setData('payment_amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-600 text-right"
                />
                {payForm.errors.payment_amount && (
                  <p className="text-[11px] text-rose-600 mt-1">{payForm.errors.payment_amount}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembayaran *</label>
                <input
                  type="date"
                  value={payForm.data.payment_date}
                  onChange={(e) => payForm.setData('payment_date', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
                {payForm.errors.payment_date && (
                  <p className="text-[11px] text-rose-600 mt-1">{payForm.errors.payment_date}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / No. Referensi Transfer (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Transfer BCA Ref #88219"
                  value={payForm.data.notes}
                  onChange={(e) => payForm.setData('notes', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAp(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payForm.processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {payForm.processing ? 'Memproses...' : 'Proses Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Pembayaran */}
      {viewingAp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold font-mono text-slate-900">{viewingAp.invoice_number}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    STATUS_BADGE[viewingAp.status]
                  }`}
                >
                  {viewingAp.status}
                </span>
              </div>
              <button onClick={() => setViewingAp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Supplier</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAp.supplier?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingAp.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Jatuh Tempo</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {formatDateOnly(viewingAp.due_date)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Sisa Tagihan</div>
                  <div className="font-mono font-bold text-rose-600 mt-0.5">
                    {formatRupiah(Math.max(0, Number(viewingAp.total_amount) - Number(viewingAp.paid_amount)))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">Riwayat Jurnal Pembayaran</h3>
                {viewingAp.journals && viewingAp.journals.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">No. Jurnal</th>
                          <th className="py-2 px-3">Tanggal</th>
                          <th className="py-2 px-3">Akun Kas / Bank</th>
                          <th className="py-2 px-3 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingAp.journals.map((j) => {
                          const creditEntry = j.entries?.find((e) => Number(e.credit) > 0);
                          return (
                            <tr key={j.id}>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-600">
                                {j.journal_number}
                              </td>
                              <td className="py-2 px-3 font-mono">{formatDateOnly(j.transaction_date)}</td>
                              <td className="py-2 px-3">
                                {creditEntry?.chart_of_account
                                  ? `[${creditEntry.chart_of_account.code}] ${creditEntry.chart_of_account.name}`
                                  : j.description}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600">
                                {formatRupiah(creditEntry?.credit ?? 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Belum ada riwayat pembayaran untuk invoice ini.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
              {viewingAp.status !== 'PAID' && (
                <button
                  onClick={() => handleOpenPay(viewingAp)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <CreditCard size={13} /> Bayar Sekarang
                </button>
              )}
              <button
                onClick={() => setViewingAp(null)}
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