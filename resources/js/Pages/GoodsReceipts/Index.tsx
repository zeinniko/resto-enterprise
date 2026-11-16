import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, X, Eye, Trash2, FileText, Building2, Truck, Calendar, Warehouse, PackageCheck
} from 'lucide-react';

interface StorageLocation {
  id: number;
  name: string;
  branch_id?: number;
}

interface Item {
  id: number;
  name: string;
  sku: string;
}

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

interface POItem {
  item_id: number;
  qty_ordered: number;
  qty_already_received?: number;
  qty_remaining?: number;
  unit_id: number;
  unit_price: number;
  item?: Item;
  unit?: Unit;
}

interface ApprovedPO {
  id: number;
  po_number: string;
  branch_id: number;
  status: 'ORDERED' | 'PARTIAL';
  branch?: { id: number; name: string; code: string };
  supplier?: { name: string };
  items?: POItem[];
}

interface GRItemDetail {
  id: number;
  qty_received: number;
  unit_cost: number;
  exp_date: string | null;
  batch_number: string | null;
  item?: Item;
  storage_location?: StorageLocation;
  unit?: Unit;
}

interface GoodsReceipt {
  id: number;
  receipt_number: string;
  received_date: string;
  notes: string | null;
  branch?: { name: string; code?: string };
  receiver?: { name: string };
  purchase_order?: { po_number: string; status?: string; supplier?: { name: string } };
  items?: GRItemDetail[];
}

interface GRFormItem {
  item_id: number;
  storage_location_id: string | number;
  qty_ordered: number;
  qty_remaining: number;
  qty_received: number | string;
  unit_id: number;
  unit_cost: number | string;
  exp_date: string;
  batch_number: string;
  item_name: string;
  item_sku: string;
  unit_symbol: string;
}

interface Props {
  goodsReceipts: {
    data: GoodsReceipt[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  approvedPOs: ApprovedPO[];
  storageLocations: StorageLocation[];
  filters: { search?: string };
}

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0].split(' ')[0];
};

const formatRupiah = (val: number | string) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function GoodsReceiptsIndex({
  goodsReceipts,
  approvedPOs,
  storageLocations,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingGR, setViewingGR] = useState<GoodsReceipt | null>(null);

  const generateGRNumber = () => {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `GR-${yymmdd}-${rand}`;
  };

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    purchase_order_id: '',
    receipt_number: generateGRNumber(),
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as GRFormItem[],
  });

  const selectedPO = useMemo(
    () => approvedPOs.find((p) => p.id === Number(data.purchase_order_id)),
    [approvedPOs, data.purchase_order_id]
  );

  const availableLocations = useMemo(() => {
    if (!selectedPO) return storageLocations;
    const filtered = storageLocations.filter(
      (s) => !s.branch_id || s.branch_id === selectedPO.branch_id
    );
    return filtered.length > 0 ? filtered : storageLocations;
  }, [storageLocations, selectedPO]);

  const totalReceiptValue = useMemo(() => {
    return data.items.reduce(
      (sum, row) => sum + (Number(row.qty_received) || 0) * (Number(row.unit_cost) || 0),
      0
    );
  }, [data.items]);

  const openCreateModal = () => {
    clearErrors();
    setData({
      purchase_order_id: '',
      receipt_number: generateGRNumber(),
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
    });
    setIsModalOpen(true);
  };

  const handlePOSelect = (poId: string) => {
    const po = approvedPOs.find((p) => p.id === Number(poId));
    if (!po || !po.items) {
      setData((prev) => ({ ...prev, purchase_order_id: poId, items: [] }));
      return;
    }

    const branchLocs = storageLocations.filter(
      (s) => !s.branch_id || s.branch_id === po.branch_id
    );
    const defaultLocId = (branchLocs[0] || storageLocations[0])?.id || '';
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    const itemsList: GRFormItem[] = po.items
      .filter((i) => (i.qty_remaining ?? i.qty_ordered) > 0)
      .map((i, idx) => {
        const defaultQty = Number(i.qty_remaining ?? i.qty_ordered);
        const rand = Math.floor(10 + Math.random() * 89);
        return {
          item_id: i.item_id,
          storage_location_id: defaultLocId,
          qty_ordered: Number(i.qty_ordered),
          qty_remaining: defaultQty,
          qty_received: defaultQty,
          unit_id: i.unit_id,
          unit_cost: Number(i.unit_price),
          exp_date: '',
          batch_number: `BCH-${yymmdd}-${idx + 1}${rand}`,
          item_name: i.item?.name || 'Unknown Item',
          item_sku: i.item?.sku || '-',
          unit_symbol: i.unit?.symbol || '',
        };
      });

    setData((prev) => ({
      ...prev,
      purchase_order_id: poId,
      items: itemsList,
    }));
  };

  const updateItemField = (idx: number, field: keyof GRFormItem, value: string | number) => {
    const updated = [...data.items];
    updated[idx] = { ...updated[idx], [field]: value };
    setData('items', updated);
  };

  const removeItemRow = (idx: number) => {
    const updated = [...data.items];
    updated.splice(idx, 1);
    setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/goods-receipts', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  return (
    <DashboardLayout>
      <Head title="Penerimaan Barang (Goods Receipt)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Penerimaan Barang (Goods Receipt)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerimaan fisik bahan baku dari PO ke gudang cabang & pencatatan Batch FEFO.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Terima Barang (GR)
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.get('/goods-receipts', { search }, { preserveState: true });
          }}
          className="relative w-full sm:w-80"
        >
          <input
            type="text"
            placeholder="Cari No. GR, No. PO, atau Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Penerimaan (GR)</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Referensi PO</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Tgl Diterima</th>
                <th className="py-3.5 px-4">Catatan / Surat Jalan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {goodsReceipts.data.length > 0 ? (
                goodsReceipts.data.map((gr) => (
                  <tr key={gr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <button onClick={() => setViewingGR(gr)} className="hover:underline text-left">
                        {gr.receipt_number}
                      </button>
                      <div className="text-[10px] font-sans font-normal text-slate-400">
                        {gr.items?.length || 0} batch item
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{gr.branch?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {gr.purchase_order?.po_number || '-'}
                    </td>
                    <td className="py-3 px-4">{gr.purchase_order?.supplier?.name || '-'}</td>
                    <td className="py-3 px-4">{formatDateOnly(gr.received_date)}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {gr.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingGR(gr)}
                        title="Lihat Detail Batch"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada riwayat penerimaan barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {goodsReceipts.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{goodsReceipts.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{goodsReceipts.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{goodsReceipts.total}</span> GR
            </div>
            <div className="flex flex-wrap gap-1">
              {goodsReceipts.links.map((link, idx) => (
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

      {/* Modal Create GR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Proses Penerimaan Barang (Goods Receipt)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {(errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {(errors as Record<string, string>).message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih PO Aktif *</label>
                  <select
                    value={data.purchase_order_id}
                    onChange={(e) => handlePOSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih PO (ORDERED / PARTIAL)</option>
                    {approvedPOs.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.po_number}] {p.supplier?.name} ({p.status})
                      </option>
                    ))}
                  </select>
                  {errors.purchase_order_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.purchase_order_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Dokumen GR *</label>
                  <input
                    type="text"
                    value={data.receipt_number}
                    onChange={(e) => setData('receipt_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {errors.receipt_number && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.receipt_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Penerimaan *</label>
                  <input
                    type="date"
                    value={data.received_date}
                    onChange={(e) => setData('received_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {errors.received_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.received_date}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Surat Jalan Supplier / Catatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SJ-SUP-0921 / Kondisi segel aman"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                {selectedPO && (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-3.5 py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Cabang Penerima:</span>
                      <div className="font-bold text-indigo-800">{selectedPO.branch?.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Supplier:</span>
                      <div className="font-semibold text-slate-800">{selectedPO.supplier?.name}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Receiving Details */}
              {data.items.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Verifikasi Item & Input Batch FEFO
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Hapus baris jika item belum dikirim pada pengiriman ini (Parsial)
                    </span>
                  </div>

                  {data.items.map((row, idx) => (
                    <div
                      key={`${row.item_id}-${idx}`}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-indigo-700">
                          <span className="font-mono text-[11px] text-slate-400 mr-1.5">[{row.item_sku}]</span>
                          {row.item_name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-500">
                            Sisa PO: <strong className="text-slate-800">{row.qty_remaining} {row.unit_symbol}</strong>
                          </span>
                          {data.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              title="Tidak diterima di GR ini"
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Qty Diterima ({row.unit_symbol}) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={row.qty_received}
                            onChange={(e) => updateItemField(idx, 'qty_received', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Harga Beli Aktual *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={row.unit_cost}
                            onChange={(e) => updateItemField(idx, 'unit_cost', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Lokasi Simpan *
                          </label>
                          <select
                            value={row.storage_location_id}
                            onChange={(e) => updateItemField(idx, 'storage_location_id', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            {availableLocations.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            No. Batch FEFO *
                          </label>
                          <input
                            type="text"
                            value={row.batch_number}
                            onChange={(e) => updateItemField(idx, 'batch_number', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Tgl Expired (FEFO)
                          </label>
                          <input
                            type="date"
                            value={row.exp_date}
                            onChange={(e) => updateItemField(idx, 'exp_date', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-lg px-4 py-3">
                    <span className="text-xs font-semibold text-slate-700">Total Nilai Stok Masuk (GR)</span>
                    <span className="text-sm font-mono font-bold text-emerald-700">
                      {formatRupiah(totalReceiptValue)}
                    </span>
                  </div>
                </div>
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
                  disabled={processing || data.items.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  <PackageCheck size={15} />
                  {processing ? 'Memproses...' : 'Proses Penerimaan & Stok FEFO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail GR */}
      {viewingGR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 font-mono">{viewingGR.receipt_number}</h2>
              </div>
              <button onClick={() => setViewingGR(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Building2 size={11} /> Cabang
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingGR.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <FileText size={11} /> Ref. PO
                  </div>
                  <div className="font-mono font-semibold text-indigo-600 mt-0.5">
                    {viewingGR.purchase_order?.po_number || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Truck size={11} /> Supplier
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingGR.purchase_order?.supplier?.name || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Calendar size={11} /> Tgl Terima
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {formatDateOnly(viewingGR.received_date)}
                  </div>
                </div>
              </div>

              {viewingGR.notes && (
                <div className="px-3.5 py-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-slate-700">
                  <span className="font-semibold">Catatan / Surat Jalan:</span> {viewingGR.notes}
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Lokasi Simpan</th>
                      <th className="py-2.5 px-3">Batch & Exp</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingGR.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{item.item?.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{item.item?.sku}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Warehouse size={11} /> {item.storage_location?.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <div className="font-semibold text-slate-700">{item.batch_number || '-'}</div>
                          <div className="text-[10px] text-slate-400">
                            Exp: {formatDateOnly(item.exp_date)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {Number(item.qty_received)} {item.unit?.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatRupiah(item.unit_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="text-[11px] text-slate-400">
                Diterima oleh: <span className="font-medium text-slate-600">{viewingGR.receiver?.name || 'System'}</span>
              </div>
              <button
                onClick={() => setViewingGR(null)}
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