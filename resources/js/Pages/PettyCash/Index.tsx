import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, X, Search, ArrowUpRight, ArrowDownLeft, Wallet, Trash2, RotateCcw, Clock
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }

interface OpenShift {
  id: number;
  branch_id: number;
  opened_at: string;
  status: string;
  user?: { id: number; name: string };
}

interface PettyCashRecord {
  id: number;
  branch_id: number;
  shift_id?: number | null;
  type: 'IN' | 'OUT';
  amount: number | string;
  category?: string | null;
  description: string;
  created_at: string;
  branch?: Branch;
  creator?: { id: number; name: string } | null;
  shift?: { id: number; opened_at: string; status: string } | null;
}

interface Props {
  records: {
    data: PettyCashRecord[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  openShifts?: OpenShift[];
  summary?: {
    total_in: number;
    total_out: number;
    balance: number;
  };
  filters?: {
    search?: string;
    branch_id?: string;
    type?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
  };
}

const CATEGORIES_OUT = [
  'Bahan Baku Mendadak',
  'Perlengkapan & Operasional',
  'Transportasi & Kurir',
  'Gas / Air / Utilitas',
  'Kebersihan & Perawatan',
  'Lain-lain',
];

const CATEGORIES_IN = [
  'Isi Ulang Kas (Top Up)',
  'Pengembalian Sisa Belanja',
  'Lain-lain',
];

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

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

export default function PettyCashIndex({
  records,
  branches = [],
  openShifts = [],
  summary = { total_in: 0, total_out: 0, balance: 0 },
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedType, setSelectedType] = useState(filters.type || '');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    type: 'OUT' as 'IN' | 'OUT',
    category: CATEGORIES_OUT[0],
    amount: '' as number | string,
    description: '',
    link_active_shift: true,
  });

  const applyFilters = (overrides?: Partial<NonNullable<Props['filters']>>) => {
    router.get(
      '/petty-cash',
      {
        search: overrides?.search ?? search,
        branch_id: overrides?.branch_id ?? selectedBranch,
        type: overrides?.type ?? selectedType,
        start_date: overrides?.start_date ?? startDate,
        end_date: overrides?.end_date ?? endDate,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBranch('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    router.get('/petty-cash', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedBranch || selectedType || startDate || endDate);

  const activeShiftForSelectedBranch = useMemo(() => {
    if (!data.branch_id) return null;
    return openShifts.find((s) => s.branch_id === Number(data.branch_id)) || null;
  }, [data.branch_id, openShifts]);

  const openCreateModal = () => {
    clearErrors();
    setData({
      branch_id: branches.length === 1 ? String(branches[0].id) : '',
      type: 'OUT',
      category: CATEGORIES_OUT[0],
      amount: '',
      description: '',
      link_active_shift: true,
    });
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: 'IN' | 'OUT') => {
    setData((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'IN' ? CATEGORIES_IN[0] : CATEGORIES_OUT[0],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/petty-cash', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleDelete = (item: PettyCashRecord) => {
    if (confirm(`Hapus catatan kas kecil "${item.description}"?`)) {
      router.delete(`/petty-cash/${item.id}`);
    }
  };

  const availableCategories = data.type === 'IN' ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <DashboardLayout>
      <Head title="Kas Kecil (Petty Cash)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kas Kecil (Petty Cash)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pengeluaran operasional mendesak, pembelian bahan dadakan, dan isi ulang kas kecil cabang.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Catat Transaksi Kas
        </button>
      </div>

      {/* Ringkasan Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Saldo Bersih Kas Kecil</div>
            <div
              className={`text-lg font-mono font-bold mt-1 ${
                summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatRupiah(summary.balance)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Kas Masuk (IN)</div>
            <div className="text-lg font-mono font-bold text-emerald-600 mt-1">
              +{formatRupiah(summary.total_in)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Kas Keluar (OUT)</div>
            <div className="text-lg font-mono font-bold text-amber-600 mt-1">
              -{formatRupiah(summary.total_out)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <ArrowUpRight size={20} />
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
          className="relative w-full lg:w-72"
        >
          <input
            type="text"
            placeholder="Cari keterangan atau kategori..."
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

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              applyFilters({ type: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Tipe</option>
            <option value="OUT">Kas Keluar (OUT)</option>
            <option value="IN">Kas Masuk (IN)</option>
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
                <th className="py-3.5 px-4">Waktu & Petugas</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Tipe & Kategori</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records?.data?.length > 0 ? (
                records.data.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-800">{formatDateTime(r.created_at)}</div>
                      <div className="text-[10px] text-slate-400">
                        Oleh: {r.creator?.name || 'Admin'}
                        {r.shift_id ? ` • Shift #${r.shift_id}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">{r.branch?.name || '-'}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border ${
                          r.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {r.type === 'IN' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {r.type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}
                      </span>
                      {r.category && (
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{r.category}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700">{r.description}</td>

                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        r.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {r.type === 'IN' ? '+' : '-'}
                      {formatRupiah(r.amount)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {(!r.shift || r.shift.status !== 'CLOSED') && (
                        <button
                          onClick={() => handleDelete(r)}
                          title="Hapus Transaksi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada transaksi kas kecil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records?.links?.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{records.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{records.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{records.total}</span> transaksi
            </div>
            <div className="flex flex-wrap gap-1">
              {records.links.map((link, idx) => (
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

      {/* Modal Input Transaksi Kas Kecil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Catat Transaksi Kas Kecil</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select
                  value={data.branch_id}
                  onChange={(e) => setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[11px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Transaksi *</label>
                  <select
                    value={data.type}
                    onChange={(e) => handleTypeChange(e.target.value as 'IN' | 'OUT')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="IN">Isi Ulang / Masuk (IN)</option>
                  </select>
                  {errors.type && <p className="text-[11px] text-rose-600 mt-1">{errors.type}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    placeholder="0"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-right"
                  />
                  {errors.amount && <p className="text-[11px] text-rose-600 mt-1">{errors.amount}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={data.category}
                  onChange={(e) => setData('category', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-[11px] text-rose-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan *</label>
                <input
                  type="text"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="misal: Beli es batu kristal 5 kantong & galon air"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
                {errors.description && <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>}
              </div>

              {activeShiftForSelectedBranch && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.link_active_shift}
                    onChange={(e) => setData('link_active_shift', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600"
                  />
                  <div>
                    <div className="font-semibold text-indigo-900 flex items-center gap-1">
                      <Clock size={12} /> Potong / Tambah ke Laci Shift Kasir Aktif (#{activeShiftForSelectedBranch.id})
                    </div>
                    <div className="text-[11px] text-indigo-700 mt-0.5">
                      Kasir: {activeShiftForSelectedBranch.user?.name || 'POS'} — otomatis dihitung saat tutup shift.
                    </div>
                  </div>
                </label>
              )}

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
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}