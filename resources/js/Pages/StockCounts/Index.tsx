import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, X, Search, Warehouse, CheckCircle2, Trash2, Eye, FileText, RotateCcw
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface StorageLocation { id: number; branch_id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; primary_unit?: Unit; }

interface StockCountDetail {
  id: number;
  item_id: number;
  system_qty: number | string;
  physical_qty: number | string;
  variance_qty: number | string;
  unit_cost: number | string;
  variance_cost: number | string;
  notes?: string | null;
  item?: Item;
  unit?: Unit;
}

interface StockCount {
  id: number;
  count_number: string;
  count_date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  total_variance_cost?: number | string | null;
  branch?: Branch;
  storage_location?: StorageLocation;
  conductor?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
  details?: StockCountDetail[];
}

interface SystemStock {
  branch_id: number;
  storage_location_id: number;
  item_id: number;
  system_qty: number | string;
}

interface Props {
  stockCounts: {
    data: StockCount[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  storageLocations: StorageLocation[];
  items: Item[];
  units: Unit[];
  systemStocks: SystemStock[];
  filters: { search?: string; status?: string; branch_id?: string };
}

const STATUS_BADGE: Record<StockCount['status'], string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  SUBMITTED: 'bg-sky-50 text-sky-700 border-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0];
};

const formatQty = (val: number | string) =>
  Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 4 });

const formatRupiah = (val: number | string) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function StockCountsIndex({
  stockCounts,
  branches = [],
  storageLocations = [],
  items = [],
  units = [],
  systemStocks = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSC, setViewingSC] = useState<StockCount | null>(null);

  const generateCountNumber = () => {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `SO-${yymmdd}-${rand}`;
  };

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    storage_location_id: '',
    count_number: generateCountNumber(),
    count_date: new Date().toISOString().split('T')[0],
    details: [{ item_id: '', physical_qty: '' as number | string, unit_id: '', notes: '' }],
  });

  const applyFilters = (overrides?: Partial<Props['filters']>) => {
    router.get(
      '/stock-counts',
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
    router.get('/stock-counts', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedBranch);

  const filteredLocations = useMemo(() => {
    if (!data.branch_id) return storageLocations;
    const matched = storageLocations.filter((s) => s.branch_id === Number(data.branch_id));
    return matched.length > 0 ? matched : storageLocations;
  }, [data.branch_id, storageLocations]);

  const getSystemQty = (itemId: string): number | null => {
    if (!data.branch_id || !data.storage_location_id || !itemId) return null;
    const found = systemStocks.find(
      (s) =>
        s.branch_id === Number(data.branch_id) &&
        s.storage_location_id === Number(data.storage_location_id) &&
        s.item_id === Number(itemId)
    );
    return found ? Number(found.system_qty) : 0;
  };

  const openCreateModal = () => {
    clearErrors();
    setData({
      branch_id: '',
      storage_location_id: '',
      count_number: generateCountNumber(),
      count_date: new Date().toISOString().split('T')[0],
      details: [{ item_id: '', physical_qty: '', unit_id: '', notes: '' }],
    });
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setData('details', [
      ...data.details,
      { item_id: '', physical_qty: '', unit_id: '', notes: '' },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (data.details.length === 1) return;
    setData(
      'details',
      data.details.filter((_, i) => i !== index)
    );
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...data.details];
    if (field === 'item_id') {
      const selected = items.find((i) => i.id === Number(value));
      updated[index] = {
        ...updated[index],
        item_id: value,
        unit_id: selected?.primary_unit ? String(selected.primary_unit.id) : updated[index].unit_id,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setData('details', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/stock-counts', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleApprove = (sc: StockCount) => {
    if (
      confirm(
        `Setujui Stock Opname ${sc.count_number}? Sistem akan menyesuaikan batch stok dan mencatat mutasi ADJUSTMENT secara permanen.`
      )
    ) {
      router.post(`/stock-counts/${sc.id}/approve`, {}, {
        onSuccess: () => setViewingSC(null),
      });
    }
  };

  const handleDelete = (sc: StockCount) => {
    if (confirm(`Hapus sesi Stock Opname ${sc.count_number}?`)) {
      router.delete(`/stock-counts/${sc.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Stock Opname" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Opname (Audit Fisik)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekonsiliasi stok fisik gudang/outlet terhadap stok sistem FEFO dan pencatatan selisih HPP.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Buat Sesi Opname
        </button>
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
            placeholder="Cari No. Opname atau Lokasi..."
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
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
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

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Opname</th>
                <th className="py-3.5 px-4">Cabang & Lokasi</th>
                <th className="py-3.5 px-4">Tgl Audit</th>
                <th className="py-3.5 px-4 text-center">Jumlah Item</th>
                <th className="py-3.5 px-4 text-right">Total Selisih HPP</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {stockCounts.data.length > 0 ? (
                stockCounts.data.map((so) => {
                  const varianceCost = Number(so.total_variance_cost || 0);
                  return (
                    <tr key={so.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        <button onClick={() => setViewingSC(so)} className="hover:underline text-left">
                          {so.count_number}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Warehouse size={12} className="text-slate-400" />
                          {so.storage_location?.name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">{so.branch?.name || '-'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{formatDateOnly(so.count_date)}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {so.details?.length ?? 0} SKU
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-semibold ${
                          varianceCost > 0
                            ? 'text-emerald-600'
                            : varianceCost < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {varianceCost > 0 ? '+' : ''}
                        {formatRupiah(varianceCost)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            STATUS_BADGE[so.status] || STATUS_BADGE.DRAFT
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingSC(so)}
                            title="Lihat Detail Selisih"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Eye size={14} />
                          </button>

                          {['DRAFT', 'SUBMITTED'].includes(so.status) && (
                            <>
                              <button
                                onClick={() => handleApprove(so)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
                              >
                                <CheckCircle2 size={12} /> Setujui
                              </button>
                              <button
                                onClick={() => handleDelete(so)}
                                title="Hapus Draft"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada data sesi Stock Opname.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {stockCounts.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{stockCounts.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{stockCounts.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{stockCounts.total}</span> sesi
            </div>
            <div className="flex flex-wrap gap-1">
              {stockCounts.links.map((link, idx) => (
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

      {/* Modal Create Sesi Opname */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Sesi Stock Opname Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Opname *</label>
                  <input
                    type="text"
                    value={data.count_number}
                    onChange={(e) => setData('count_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50"
                  />
                  {errors.count_number && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.count_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Audit *</label>
                  <input
                    type="date"
                    value={data.count_date}
                    onChange={(e) => setData('count_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  />
                  {errors.count_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.count_date}</p>
                  )}
                </div>

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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.branch_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan *</label>
                  <select
                    value={data.storage_location_id}
                    onChange={(e) => setData('storage_location_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Hasil Cek Fisik Item *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {errors.details && (
                  <p className="text-[11px] text-rose-600 mb-2">{errors.details}</p>
                )}

                <div className="space-y-2.5">
                  {data.details.map((row, idx) => {
                    const sysQty = getSystemQty(row.item_id);
                    const hasPhys = row.physical_qty !== '' && row.physical_qty !== null;
                    const diff = sysQty !== null && hasPhys ? Number(row.physical_qty) - sysQty : null;

                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <select
                            value={row.item_id}
                            onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                            className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="">Pilih Item SKU</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                [{i.sku}] {i.name}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="Qty Fisik"
                            value={row.physical_qty}
                            onChange={(e) => handleItemChange(idx, 'physical_qty', e.target.value)}
                            className="w-28 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                          />

                          <select
                            value={row.unit_id}
                            onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)}
                            className="w-24 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="">Satuan</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.symbol}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Catatan (opsional)"
                            value={row.notes}
                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                            className="w-40 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />

                          {data.details.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {sysQty !== null && (
                          <div className="flex items-center gap-4 text-[11px] text-slate-500 pl-1">
                            <span>
                              Stok Sistem: <strong className="font-mono text-slate-700">{formatQty(sysQty)}</strong>
                            </span>
                            {diff !== null && (
                              <span>
                                Estimasi Selisih:{' '}
                                <strong
                                  className={`font-mono ${
                                    diff > 0
                                      ? 'text-emerald-600'
                                      : diff < 0
                                      ? 'text-rose-600'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {diff > 0 ? `+${formatQty(diff)}` : formatQty(diff)}
                                </strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : 'Simpan Sesi Opname'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Rekonsiliasi Opname */}
      {viewingSC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 font-mono">{viewingSC.count_number}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    STATUS_BADGE[viewingSC.status]
                  }`}
                >
                  {viewingSC.status}
                </span>
              </div>
              <button onClick={() => setViewingSC(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingSC.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Audit</div>
                  <div className="font-semibold text-indigo-700 mt-0.5">{viewingSC.storage_location?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Audit</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {formatDateOnly(viewingSC.count_date)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Auditor / Approver</div>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {viewingSC.conductor?.name || 'System'}
                    {viewingSC.approver ? ` / ${viewingSC.approver.name}` : ''}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Item SKU</th>
                      <th className="py-2.5 px-3 text-right">Sistem</th>
                      <th className="py-2.5 px-3 text-right">Fisik</th>
                      <th className="py-2.5 px-3 text-right">Selisih Qty</th>
                      <th className="py-2.5 px-3 text-right">Selisih HPP</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingSC.details?.map((d) => {
                      const vQty = Number(d.variance_qty || 0);
                      const vCost = Number(d.variance_cost || 0);
                      return (
                        <tr key={d.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{d.item?.sku}]</span>
                            <span className="font-semibold text-slate-800">{d.item?.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatQty(d.system_qty)} {d.unit?.symbol}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {formatQty(d.physical_qty)} {d.unit?.symbol}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              vQty > 0 ? 'text-emerald-600' : vQty < 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {vQty > 0 ? `+${formatQty(vQty)}` : formatQty(vQty)} {d.unit?.symbol}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono ${
                              vCost > 0 ? 'text-emerald-600' : vCost < 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {vCost > 0 ? '+' : ''}
                            {formatRupiah(vCost)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{d.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
              {['DRAFT', 'SUBMITTED'].includes(viewingSC.status) && (
                <button
                  onClick={() => handleApprove(viewingSC)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <CheckCircle2 size={14} /> Setujui & Eksekusi Penyesuaian
                </button>
              )}
              <button
                onClick={() => setViewingSC(null)}
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