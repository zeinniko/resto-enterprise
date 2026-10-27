import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Warehouse, AlertCircle, Clock } from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Item { id: number; name: string; sku: string; }
interface StorageLocation { id: number; name: string; }
interface Unit { id: number; symbol: string; }

interface StockBatch {
  id: number;
  batch_number: string;
  initial_qty: number;
  current_qty: number;
  unit_cost: number;
  exp_date: string | null;
  branch?: Branch;
  storageLocation?: StorageLocation;
  item?: Item;
  unit?: Unit;
}

interface Props {
  stockBatches: {
    data: StockBatch[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches: Branch[];
  filters: { search?: string; branch_id?: string; active_only?: string };
}

export default function StockBatchesIndex({ stockBatches, branches, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [activeOnly, setActiveOnly] = useState(filters.active_only === 'true');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/stock-batches', { search, branch_id: selectedBranch, active_only: activeOnly }, { preserveState: true });
  };

  return (
    <DashboardLayout>
      <Head title="Batch Stok FEFO" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batch Stok FEFO (First Expired, First Out)</h1>
          <p className="text-xs text-slate-500 mt-1">Monitoring urutan stok aktif berdasarkan nomor batch dan tanggal kadaluwarsa.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari Batch / Item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              router.get('/stock-batches', { search, branch_id: e.target.value, active_only: activeOnly }, { preserveState: true });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
          </select>

          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                router.get('/stock-batches', { search, branch_id: selectedBranch, active_only: e.target.checked }, { preserveState: true });
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            Hanya Stok Ada (&gt;0)
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. Batch</th>
              <th className="py-3.5 px-4">Nama Item SKU</th>
              <th className="py-3.5 px-4">Lokasi & Cabang</th>
              <th className="py-3.5 px-4">Stok Tersisa / Awal</th>
              <th className="py-3.5 px-4">HPP Unit</th>
              <th className="py-3.5 px-4">Expired Date (FEFO)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {stockBatches.data.length > 0 ? (
              stockBatches.data.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{b.batch_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{b.item?.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{b.storageLocation?.name}</span>
                    <span className="text-slate-400 block text-[10px]">{b.branch?.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={b.current_qty > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                      {b.current_qty}
                    </span>
                    <span className="text-slate-400 font-normal"> / {b.initial_qty} {b.unit?.symbol}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">Rp {Number(b.unit_cost).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    {b.exp_date ? (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        <Clock size={11} /> {b.exp_date}
                      </span>
                    ) : (
                      <span className="text-slate-400">Non-Expiring</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada data Batch Stok FEFO.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}