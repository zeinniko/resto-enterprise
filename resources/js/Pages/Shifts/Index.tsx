import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Clock, X, Lock, Eye, RotateCcw, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }

interface Shift {
  id: number;
  opened_at: string;
  closed_at: string | null;
  starting_cash: number | string;
  ending_cash_actual: number | string | null;
  ending_cash_expected: number | string | null;
  variance: number | string | null;
  status: 'OPEN' | 'CLOSED';
  notes: string | null;
  orders_count?: number;
  live_cash_sales?: number;
  live_petty_cash?: number;
  live_expected_cash?: number;
  branch?: Branch;
  user?: { id: number; name: string };
}

interface Props {
  shifts: {
    data: Shift[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  filters?: { branch_id?: string; status?: string };
}

const formatDateTime = (val?: string | null) => {
  if (!val) return '-';
  return new Date(val).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRupiah = (val?: number | string | null) => {
  if (val === null || val === undefined || val === '') return '-';
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
};

export default function ShiftsIndex({ shifts, branches = [], filters = {} }: Props) {
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [closingShift, setClosingShift] = useState<Shift | null>(null);
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);

  const openShiftForm = useForm({
    branch_id: '',
    starting_cash: 500000 as number | string,
    notes: '',
  });

  const closeShiftForm = useForm({
    ending_cash_actual: '' as number | string,
    notes: '',
  });

  const applyFilters = (overrides?: { branch_id?: string; status?: string }) => {
    router.get(
      '/shifts',
      {
        branch_id: overrides?.branch_id ?? selectedBranch,
        status: overrides?.status ?? selectedStatus,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSelectedBranch('');
    setSelectedStatus('');
    router.get('/shifts', {}, { preserveState: true });
  };

  const openNewShiftModal = () => {
    openShiftForm.clearErrors();
    openShiftForm.setData({
      branch_id: branches.length === 1 ? String(branches[0].id) : '',
      starting_cash: 500000,
      notes: '',
    });
    setIsOpenModalOpen(true);
  };

  const openCloseShiftModal = (shift: Shift) => {
    closeShiftForm.clearErrors();
    const defaultExpected = shift.live_expected_cash ?? Number(shift.starting_cash || 0);
    closeShiftForm.setData({
      ending_cash_actual: defaultExpected,
      notes: '',
    });
    setClosingShift(shift);
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openShiftForm.post('/shifts', {
      onSuccess: () => {
        setIsOpenModalOpen(false);
        openShiftForm.reset();
      },
    });
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingShift) return;
    closeShiftForm.post(`/shifts/${closingShift.id}/close`, {
      onSuccess: () => {
        setClosingShift(null);
        closeShiftForm.reset();
      },
    });
  };

  const expectedForClosing = closingShift
    ? Number(closingShift.live_expected_cash ?? closingShift.starting_cash ?? 0)
    : 0;
  const actualForClosing = Number(closeShiftForm.data.ending_cash_actual || 0);
  const liveVariance = actualForClosing - expectedForClosing;

  return (
    <DashboardLayout>
      <Head title="Shift Register Kasir" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shift Register Kasir POS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pembukaan kas awal (modal laci) dan penutupan rekonsiliasi setoran kasir harian.
          </p>
        </div>
        <button
          onClick={openNewShiftModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Buka Shift Kasir Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-3">
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

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            applyFilters({ status: e.target.value });
          }}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="OPEN">OPEN (Aktif)</option>
          <option value="CLOSED">CLOSED (Selesai)</option>
        </select>

        {(selectedBranch || selectedStatus) && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">Petugas & Cabang</th>
                <th className="py-3.5 px-4">Waktu Buka / Tutup</th>
                <th className="py-3.5 px-4 text-right">Modal Awal</th>
                <th className="py-3.5 px-4 text-right">Kas Sistem</th>
                <th className="py-3.5 px-4 text-right">Setoran Aktual</th>
                <th className="py-3.5 px-4 text-right">Selisih</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shifts.data.length > 0 ? (
                shifts.data.map((s) => {
                  const varianceNum = s.variance !== null ? Number(s.variance) : null;
                  const expectedDisplay =
                    s.status === 'CLOSED' ? s.ending_cash_expected : s.live_expected_cash;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.user?.name || 'Kasir POS'}</div>
                        <div className="text-[11px] text-slate-500">{s.branch?.name || '-'}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Clock size={11} className="text-emerald-600" />
                          <span>{formatDateTime(s.opened_at)}</span>
                        </div>
                        {s.closed_at && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Tutup: {formatDateTime(s.closed_at)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {formatRupiah(s.starting_cash)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(expectedDisplay)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(s.ending_cash_actual)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {varianceNum === null ? (
                          <span className="text-slate-400 font-normal">-</span>
                        ) : varianceNum === 0 ? (
                          <span className="text-emerald-600">Rp 0 (Pas)</span>
                        ) : varianceNum > 0 ? (
                          <span className="text-sky-600">+{formatRupiah(varianceNum)}</span>
                        ) : (
                          <span className="text-rose-600">-{formatRupiah(Math.abs(varianceNum))}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingShift(s)}
                            title="Detail Register"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Eye size={14} />
                          </button>

                          {s.status === 'OPEN' && (
                            <button
                              onClick={() => openCloseShiftModal(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition-colors"
                            >
                              <Lock size={11} /> Tutup Shift
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
                    Belum ada data register shift kasir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {shifts.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{shifts.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{shifts.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{shifts.total}</span> shift
            </div>
            <div className="flex flex-wrap gap-1">
              {shifts.links.map((link, idx) => (
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

      {/* Modal Buka Shift */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Buka Shift Kasir Baru</h2>
              <button onClick={() => setIsOpenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              {(openShiftForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{(openShiftForm.errors as Record<string, string>).message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select
                  value={openShiftForm.data.branch_id}
                  onChange={(e) => openShiftForm.setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
                {openShiftForm.errors.branch_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{openShiftForm.errors.branch_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modal Kas Awal Laci (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={openShiftForm.data.starting_cash}
                  onChange={(e) => openShiftForm.setData('starting_cash', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-600 text-right"
                />
                {openShiftForm.errors.starting_cash && (
                  <p className="text-[11px] text-rose-600 mt-1">{openShiftForm.errors.starting_cash}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pembukaan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Shift Pagi - Laci Kasir 1"
                  value={openShiftForm.data.notes}
                  onChange={(e) => openShiftForm.setData('notes', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={openShiftForm.processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {openShiftForm.processing ? 'Membuka...' : 'Buka Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {closingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tutup Shift & Audit Setoran</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {closingShift.user?.name} — {closingShift.branch?.name}
                </p>
              </div>
              <button onClick={() => setClosingShift(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="p-6 space-y-4">
              {(closeShiftForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {(closeShiftForm.errors as Record<string, string>).message}
                </div>
              )}

              {/* Ringkasan Perhitungan Kas Sistem */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Modal Kas Awal:</span>
                  <span className="font-mono font-semibold">{formatRupiah(closingShift.starting_cash)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Penjualan Tunai (CASH):</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    +{formatRupiah(closingShift.live_cash_sales ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mutasi Petty Cash:</span>
                  <span className="font-mono font-semibold">
                    {Number(closingShift.live_petty_cash ?? 0) >= 0 ? '+' : ''}
                    {formatRupiah(closingShift.live_petty_cash ?? 0)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Ekspektasi Kas di Laci:</span>
                  <span className="font-mono text-indigo-600">{formatRupiah(expectedForClosing)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Setoran Kas Fisik Aktual (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={closeShiftForm.data.ending_cash_actual}
                  onChange={(e) => closeShiftForm.setData('ending_cash_actual', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-right"
                />
                {closeShiftForm.errors.ending_cash_actual && (
                  <p className="text-[11px] text-rose-600 mt-1">{closeShiftForm.errors.ending_cash_actual}</p>
                )}

                <div className="mt-2 flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500">Selisih Kas (Variance):</span>
                  <span
                    className={`font-mono font-bold ${
                      liveVariance === 0
                        ? 'text-emerald-600'
                        : liveVariance > 0
                        ? 'text-sky-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {liveVariance === 0
                      ? 'Rp 0 (Sesuai)'
                      : liveVariance > 0
                      ? `+${formatRupiah(liveVariance)} (Lebih)`
                      : `-${formatRupiah(Math.abs(liveVariance))} (Kurang)`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Audit Penutupan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan jika terdapat selisih kas..."
                  value={closeShiftForm.data.notes}
                  onChange={(e) => closeShiftForm.setData('notes', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClosingShift(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={closeShiftForm.processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {closeShiftForm.processing ? 'Memproses...' : 'Tutup Shift & Kunci Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Shift */}
      {viewingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Detail Register Shift #{viewingShift.id}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    viewingShift.status === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {viewingShift.status}
                </span>
              </div>
              <button onClick={() => setViewingShift(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kasir</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingShift.user?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingShift.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Waktu Buka</div>
                  <div className="font-medium text-slate-700 mt-0.5">{formatDateTime(viewingShift.opened_at)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Waktu Tutup</div>
                  <div className="font-medium text-slate-700 mt-0.5">{formatDateTime(viewingShift.closed_at)}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Modal Kas Awal:</span>
                  <span className="font-mono font-semibold">{formatRupiah(viewingShift.starting_cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ekspektasi Kas Sistem:</span>
                  <span className="font-mono font-semibold">
                    {formatRupiah(
                      viewingShift.status === 'CLOSED'
                        ? viewingShift.ending_cash_expected
                        : viewingShift.live_expected_cash
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Setoran Fisik Aktual:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(viewingShift.ending_cash_actual)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold">
                  <span className="text-slate-700">Selisih (Variance):</span>
                  <span className="font-mono">
                    {viewingShift.variance === null
                      ? '-'
                      : Number(viewingShift.variance) >= 0
                      ? `+${formatRupiah(viewingShift.variance)}`
                      : `-${formatRupiah(Math.abs(Number(viewingShift.variance)))}`}
                  </span>
                </div>
              </div>

              {viewingShift.notes && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-slate-700">
                  <div className="text-[10px] font-bold text-amber-800 uppercase mb-0.5">Catatan</div>
                  <div>{viewingShift.notes}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewingShift(null)}
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