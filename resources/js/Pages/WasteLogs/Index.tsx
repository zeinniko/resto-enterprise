import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, X, AlertTriangle, Warehouse, User, RotateCcw, DollarSign, FileWarning
} from 'lucide-react';

type WasteReason = 'EXPIRED' | 'SPOILED_PREP' | 'SPILLED_ACCIDENT' | 'QUALITY_REJECT';

interface Branch { id: number; name: string; code: string; }
interface StorageLocation { id: number; branch_id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; primary_unit?: Unit; }

interface WasteLog {
  id: number;
  qty: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  reason: WasteReason;
  created_at: string;
  branch?: Branch;
  storage_location?: StorageLocation;
  item?: Item;
  stock_batch?: { id: number; batch_number: string; exp_date?: string | null };
  unit?: Unit;
  logger?: { id: number; name: string } | null;
}

interface AvailableStock {
  branch_id: number;
  storage_location_id: number;
  item_id: number;
  available_qty: number | string;
}

interface Summary {
  total_entries: number;
  total_loss: number;
  expired_loss: number;
}

interface Props {
  wasteLogs: {
    data: WasteLog[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  storageLocations: StorageLocation[];
  items: Item[];
  units: Unit[];
  availableStocks: AvailableStock[];
  summary: Summary;
  filters: { search?: string; branch_id?: string; reason?: string };
}

const REASON_CONFIG: Record<WasteReason, { label: string; badge: string }> = {
  EXPIRED: {
    label: 'Kadaluwarsa (Expired)',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  SPOILED_PREP: {
    label: 'Basi / Rusak Saat Prep',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  SPILLED_ACCIDENT: {
    label: 'Tumpah / Kecelakaan Dapur',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  QUALITY_REJECT: {
    label: 'Kualitas Reject / Tidak Layak',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

const formatDateTime = (val: string) =>
  new Date(val).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatRupiah = (val: number | string) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

const formatQty = (val: number | string) =>
  Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 4 });

export default function WasteLogsIndex({
  wasteLogs,
  branches,
  storageLocations,
  items,
  units,
  availableStocks,
  summary,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedReason, setSelectedReason] = useState(filters.reason || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    storage_location_id: '',
    item_id: '',
    qty: 1 as number | string,
    unit_id: '',
    reason: 'EXPIRED' as WasteReason,
  });

  const applyFilters = (overrides?: Partial<Props['filters']>) => {
    router.get(
      '/waste-logs',
      {
        search: overrides?.search ?? search,
        branch_id: overrides?.branch_id ?? selectedBranch,
        reason: overrides?.reason ?? selectedReason,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBranch('');
    setSelectedReason('');
    router.get('/waste-logs', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedBranch || selectedReason);

  const filteredLocations = useMemo(() => {
    if (!data.branch_id) return storageLocations;
    const matched = storageLocations.filter((s) => s.branch_id === Number(data.branch_id));
    return matched.length > 0 ? matched : storageLocations;
  }, [data.branch_id, storageLocations]);

  const currentAvailableStock = useMemo(() => {
    if (!data.branch_id || !data.storage_location_id || !data.item_id) return null;
    const found = availableStocks.find(
      (s) =>
        s.branch_id === Number(data.branch_id) &&
        s.storage_location_id === Number(data.storage_location_id) &&
        s.item_id === Number(data.item_id)
    );
    return found ? Number(found.available_qty) : 0;
  }, [data.branch_id, data.storage_location_id, data.item_id, availableStocks]);

  const selectedItemObj = useMemo(
    () => items.find((i) => i.id === Number(data.item_id)),
    [data.item_id, items]
  );

  const openModal = () => {
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const handleItemSelect = (itemId: string) => {
    const selected = items.find((i) => i.id === Number(itemId));
    setData((prev) => ({
      ...prev,
      item_id: itemId,
      unit_id: selected?.primary_unit ? String(selected.primary_unit.id) : prev.unit_id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/waste-logs', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <DashboardLayout>
      <Head title="Pencatatan Waste" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Waste / Kerusakan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan bahan terbuang atau kadaluwarsa dengan pemotongan batch stok FEFO & kalkulasi kerugian HPP otomatis.
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Catat Waste Baru
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <FileWarning size={13} className="text-indigo-600" /> Total Kejadian Waste
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {summary.total_entries.toLocaleString('id-ID')} catatan
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <DollarSign size={13} className="text-rose-600" /> Total Kerugian HPP
          </div>
          <div className="text-lg font-bold font-mono text-rose-600 mt-1">
            {formatRupiah(summary.total_loss)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-600" /> Kerugian Akibat Expired
          </div>
          <div className="text-lg font-bold font-mono text-amber-700 mt-1">
            {formatRupiah(summary.expired_loss)}
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
            placeholder="Cari Item SKU atau No. Batch..."
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
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              applyFilters({ reason: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Kategori Alasan</option>
            {Object.entries(REASON_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">Waktu & Operator</th>
                <th className="py-3.5 px-4">Cabang & Lokasi</th>
                <th className="py-3.5 px-4">Item SKU & Batch</th>
                <th className="py-3.5 px-4">Alasan</th>
                <th className="py-3.5 px-4 text-right">Qty Terbuang</th>
                <th className="py-3.5 px-4 text-right">Kerugian (HPP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {wasteLogs.data.length > 0 ? (
                wasteLogs.data.map((w) => {
                  const reasonInfo = REASON_CONFIG[w.reason] || {
                    label: w.reason,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{formatDateTime(w.created_at)}</div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <User size={10} /> {w.logger?.name || 'System'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Warehouse size={11} className="text-slate-400" />
                          {w.storage_location?.name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">{w.branch?.name || '-'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{w.item?.name || '-'}</div>
                        <div className="font-mono text-[10px] text-indigo-600 mt-0.5">
                          Batch: {w.stock_batch?.batch_number || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${reasonInfo.badge}`}
                        >
                          {reasonInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        -{formatQty(w.qty)} {w.unit?.symbol}
                      </td>

                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatRupiah(w.total_cost)}</div>
                        <div className="text-[10px] text-slate-400">
                          @{formatRupiah(w.unit_cost)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada catatan waste sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {wasteLogs.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{wasteLogs.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{wasteLogs.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{wasteLogs.total}</span> catatan
            </div>
            <div className="flex flex-wrap gap-1">
              {wasteLogs.links.map((link, idx) => (
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Input Waste / Kerusakan Bahan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                <select
                  value={data.branch_id}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      branch_id: e.target.value,
                      storage_location_id: '',
                    }))
                  }
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan *</label>
                <select
                  value={data.storage_location_id}
                  onChange={(e) => setData('storage_location_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Lokasi</option>
                  {filteredLocations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.storage_location_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.storage_location_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item SKU *</label>
                <select
                  value={data.item_id}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Item SKU</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      [{i.sku}] {i.name}
                    </option>
                  ))}
                </select>
                {errors.item_id && <p className="text-[11px] text-rose-600 mt-1">{errors.item_id}</p>}

                {currentAvailableStock !== null && (
                  <p
                    className={`text-[11px] mt-1 font-medium ${
                      currentAvailableStock > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Stok tersedia di lokasi ini:{' '}
                    <span className="font-mono font-bold">
                      {formatQty(currentAvailableStock)} {selectedItemObj?.primary_unit?.symbol || ''}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty Terbuang *</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={data.qty}
                    onChange={(e) => setData('qty', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-right"
                  />
                  {errors.qty && <p className="text-[11px] text-rose-600 mt-1">{errors.qty}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select
                    value={data.unit_id}
                    onChange={(e) => setData('unit_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Satuan</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.symbol}
                      </option>
                    ))}
                  </select>
                  {errors.unit_id && <p className="text-[11px] text-rose-600 mt-1">{errors.unit_id}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Alasan Waste *
                </label>
                <select
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value as WasteReason)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {Object.entries(REASON_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                {errors.reason && <p className="text-[11px] text-rose-600 mt-1">{errors.reason}</p>}
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
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : 'Simpan Waste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}