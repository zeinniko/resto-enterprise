import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import {
  Search, Warehouse, AlertTriangle, Clock, CheckCircle2, Package, Layers
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Item { id: number; name: string; sku: string; }
interface StorageLocation { id: number; name: string; }
interface Unit { id: number; symbol: string; }

interface StockBatch {
  id: number;
  batch_number: string;
  initial_qty: number | string;
  current_qty: number | string;
  unit_cost: number | string;
  exp_date: string | null;
  branch?: Branch;
  storage_location?: StorageLocation;
  item?: Item;
  unit?: Unit;
  goods_receipt_item?: {
    goods_receipt?: { receipt_number: string };
  };
  production_order?: {
    production_number: string;
  };
}

interface Summary {
  active_batches: number;
  near_expiry: number;
  expired: number;
  total_value: number;
}

interface Props {
  stockBatches: {
    data: StockBatch[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  summary: Summary;
  filters: {
    search?: string;
    branch_id?: string;
    expiry_status?: string;
    active_only?: boolean;
  };
}

const formatDateOnly = (val?: string | null) => {
  if (!val) return null;
  return val.split('T')[0];
};

const formatRupiah = (val: number | string) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

const formatQty = (val: number | string) =>
  Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 4 });

function getExpiryBadge(expDate: string | null) {
  const cleanDate = formatDateOnly(expDate);
  if (!cleanDate) {
    return <span className="text-slate-400 text-[11px]">Non-Expiring</span>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${cleanDate}T00:00:00`);
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
        <AlertTriangle size={11} /> {cleanDate} (Exp)
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
        <Clock size={11} /> {cleanDate} (H-{diffDays})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
      <CheckCircle2 size={11} /> {cleanDate}
    </span>
  );
}

export default function StockBatchesIndex({ stockBatches, branches, summary, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [expiryStatus, setExpiryStatus] = useState(filters.expiry_status || '');
  const [activeOnly, setActiveOnly] = useState(Boolean(filters.active_only));

  const applyFilters = (overrides?: {
    search?: string;
    branch_id?: string;
    expiry_status?: string;
    active_only?: boolean;
  }) => {
    router.get(
      '/stock-batches',
      {
        search: overrides?.search ?? search,
        branch_id: overrides?.branch_id ?? selectedBranch,
        expiry_status: overrides?.expiry_status ?? expiryStatus,
        active_only: overrides?.active_only ?? activeOnly,
      },
      { preserveState: true }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <DashboardLayout>
      <Head title="Batch Stok FEFO" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Batch Stok FEFO (First Expired, First Out)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring antrean stok aktif berdasarkan nomor batch, valuasi HPP, dan tanggal kadaluwarsa terdekat.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-600" /> Batch Aktif (&gt;0)
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {summary.active_batches.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-600" /> Mendekati Expired (≤7 Hari)
          </div>
          <div className="text-lg font-bold font-mono text-amber-600 mt-1">
            {summary.near_expiry.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-rose-600" /> Sudah Expired
          </div>
          <div className="text-lg font-bold font-mono text-rose-600 mt-1">
            {summary.expired.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Package size={13} className="text-emerald-600" /> Total Valuasi Batch
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1 truncate">
            {formatRupiah(summary.total_value)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Cari No. Batch, SKU, atau Nama Item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
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
            value={expiryStatus}
            onChange={(e) => {
              setExpiryStatus(e.target.value);
              applyFilters({ expiry_status: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Status Kadaluwarsa</option>
            <option value="near_expiry">Segera Expired (≤ 7 Hari)</option>
            <option value="expired">Sudah Expired</option>
          </select>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                applyFilters({ active_only: e.target.checked });
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            Hanya Stok Ada (&gt;0)
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Batch & Sumber</th>
                <th className="py-3.5 px-4">Item SKU</th>
                <th className="py-3.5 px-4">Lokasi & Cabang</th>
                <th className="py-3.5 px-4 text-right">Stok Tersisa / Awal</th>
                <th className="py-3.5 px-4 text-right">HPP Unit & Valuasi</th>
                <th className="py-3.5 px-4">Expired Date (FEFO)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {stockBatches.data.length > 0 ? (
                stockBatches.data.map((b) => {
                  const currentQty = Number(b.current_qty || 0);
                  const initialQty = Number(b.initial_qty || 0);
                  const unitCost = Number(b.unit_cost || 0);
                  const batchValue = currentQty * unitCost;
                  const sourceRef =
                    b.goods_receipt_item?.goods_receipt?.receipt_number ||
                    b.production_order?.production_number ||
                    null;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-600">{b.batch_number}</div>
                        {sourceRef && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Ref: {sourceRef}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.item?.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{b.item?.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Warehouse size={11} className="text-slate-400" />
                          {b.storage_location?.name || '-'}
                        </span>
                        <span className="text-slate-400 block text-[10px]">{b.branch?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={currentQty > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                          {formatQty(currentQty)}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {' '}
                          / {formatQty(initialQty)} {b.unit?.symbol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-slate-800">{formatRupiah(unitCost)}</div>
                        <div className="text-[10px] text-slate-400">
                          Total: {formatRupiah(batchValue)}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getExpiryBadge(b.exp_date)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada data Batch Stok FEFO sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {stockBatches.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{stockBatches.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{stockBatches.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{stockBatches.total}</span> batch
            </div>
            <div className="flex flex-wrap gap-1">
              {stockBatches.links.map((link, idx) => (
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