import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import {
  Search, ArrowRight, ArrowDownLeft, ArrowUpRight, RotateCcw, User
} from 'lucide-react';

interface StockMovement {
  id: number;
  movement_type:
    | 'IN_PURCHASE'
    | 'IN_PRODUCTION'
    | 'IN_TRANSFER'
    | 'OUT_SALE'
    | 'OUT_TRANSFER'
    | 'OUT_PRODUCTION'
    | 'WASTE'
    | 'ADJUSTMENT';
  qty: number | string;
  created_at: string;
  reference_label?: string | null;
  reference_short_type?: string | null;
  branch?: { id: number; name: string; code: string };
  item?: { id: number; name: string; sku: string };
  stock_batch?: { id: number; batch_number: string; exp_date?: string | null };
  from_location?: { id: number; name: string } | null;
  to_location?: { id: number; name: string } | null;
  unit?: { id: number; symbol: string };
  creator?: { id: number; name: string } | null;
}

interface Props {
  movements: {
    data: StockMovement[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: { id: number; name: string; code: string }[];
  filters: {
    search?: string;
    movement_type?: string;
    branch_id?: string;
    date_from?: string;
    date_to?: string;
  };
}

const MOVEMENT_LABELS: Record<string, string> = {
  IN_PURCHASE: 'Penerimaan PO (IN)',
  IN_PRODUCTION: 'Hasil Produksi (IN)',
  IN_TRANSFER: 'Transfer Masuk (IN)',
  OUT_SALE: 'Penjualan POS (OUT)',
  OUT_TRANSFER: 'Transfer Keluar (OUT)',
  OUT_PRODUCTION: 'Bahan Produksi (OUT)',
  WASTE: 'Waste / Rusak (OUT)',
  ADJUSTMENT: 'Stock Opname (ADJ)',
};

const formatDateTime = (val: string) => {
  const d = new Date(val);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatQty = (val: number | string) =>
  Math.abs(Number(val || 0)).toLocaleString('id-ID', { maximumFractionDigits: 4 });

export default function StockMovementsIndex({ movements, branches, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState(filters.movement_type || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');

  const applyFilters = (overrides?: Partial<Props['filters']>) => {
    router.get(
      '/stock-movements',
      {
        search: overrides?.search ?? search,
        movement_type: overrides?.movement_type ?? selectedType,
        branch_id: overrides?.branch_id ?? selectedBranch,
        date_from: overrides?.date_from ?? dateFrom,
        date_to: overrides?.date_to ?? dateTo,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedBranch('');
    setDateFrom('');
    setDateTo('');
    router.get('/stock-movements', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedType || selectedBranch || dateFrom || dateTo);

  const isIncoming = (m: StockMovement) => {
    if (m.movement_type.startsWith('IN_')) return true;
    if (m.movement_type === 'ADJUSTMENT') {
      if (Number(m.qty) < 0) return false;
      if (m.from_location && !m.to_location) return false;
      return true;
    }
    return false;
  };

  return (
    <DashboardLayout>
      <Head title="Pergerakan Stok Ledger" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pergerakan Stok (Audit Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail seluruh mutasi barang masuk, keluar, produksi, transfer, waste, dan penyesuaian opname.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="relative w-full lg:w-80"
          >
            <input
              type="text"
              placeholder="Cari SKU, Nama Item, atau No. Batch..."
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
                applyFilters({ movement_type: e.target.value });
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
            >
              <option value="">Semua Jenis Pergerakan</option>
              <option value="IN_PURCHASE">Penerimaan PO (IN)</option>
              <option value="OUT_SALE">Penjualan POS (OUT)</option>
              <option value="IN_TRANSFER">Transfer Masuk (IN)</option>
              <option value="OUT_TRANSFER">Transfer Keluar (OUT)</option>
              <option value="IN_PRODUCTION">Hasil Produksi (IN)</option>
              <option value="OUT_PRODUCTION">Bahan Produksi (OUT)</option>
              <option value="WASTE">Waste / Rusak (OUT)</option>
              <option value="ADJUSTMENT">Stock Opname (ADJ)</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  applyFilters({ date_from: e.target.value });
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                title="Dari Tanggal"
              />
              <span>s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  applyFilters({ date_to: e.target.value });
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                title="Sampai Tanggal"
              />
            </div>

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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">Waktu & Cabang</th>
                <th className="py-3.5 px-4">Tipe & Referensi</th>
                <th className="py-3.5 px-4">Item SKU</th>
                <th className="py-3.5 px-4">No. Batch</th>
                <th className="py-3.5 px-4">Alur Lokasi</th>
                <th className="py-3.5 px-4 text-right">Mutasi Qty</th>
                <th className="py-3.5 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {movements.data.length > 0 ? (
                movements.data.map((m) => {
                  const incoming = isIncoming(m);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{formatDateTime(m.created_at)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.branch?.name || '-'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            incoming
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {incoming ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {MOVEMENT_LABELS[m.movement_type] || m.movement_type}
                        </span>
                        {m.reference_label && (
                          <div className="font-mono text-[10px] text-slate-500 mt-1">
                            {m.reference_short_type}: <span className="font-semibold">{m.reference_label}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.item?.name || '-'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.item?.sku || '-'}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-indigo-600 font-medium">
                        {m.stock_batch?.batch_number || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          <span className={m.from_location ? 'font-medium text-slate-800' : 'text-slate-400 italic'}>
                            {m.from_location?.name || 'Eksternal'}
                          </span>
                          <ArrowRight size={12} className="text-slate-400 shrink-0" />
                          <span className={m.to_location ? 'font-medium text-slate-800' : 'text-slate-400 italic'}>
                            {m.to_location?.name || 'Eksternal'}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`py-3 px-4 font-mono font-bold text-right whitespace-nowrap ${
                          incoming ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {incoming ? '+' : '-'}
                        {formatQty(m.qty)} {m.unit?.symbol}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <User size={11} className="text-slate-400" />
                          {m.creator?.name || 'System'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada riwayat pergerakan stok sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {movements.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{movements.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{movements.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{movements.total}</span> mutasi
            </div>
            <div className="flex flex-wrap gap-1">
              {movements.links.map((link, idx) => (
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
    </DashboardLayout>
  );
}