import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, Trash2, X, Eye, Pencil, Send, Ban, FileText, Calendar, Building2, Truck
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Supplier { id: number; name: string; code: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; purchase_unit?: Unit; }

type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';

interface POItem {
  id?: number;
  item_id: number;
  qty_ordered: number;
  unit_id: number;
  unit_price: number;
  subtotal: number;
  item?: Item;
  unit?: Unit;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: POStatus;
  total_amount: number;
  branch_id: number;
  supplier_id: number;
  branch?: Branch;
  supplier?: Supplier;
  creator?: { id: number; name: string };
  items?: POItem[];
}

interface Props {
  purchaseOrders: {
    data: PurchaseOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  suppliers: Supplier[];
  items: Item[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

const STATUS_BADGE: Record<POStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  ORDERED: 'bg-sky-50 text-sky-700 border-sky-200',
  PARTIAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDateInput = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

const formatRupiah = (val: number | string) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function PurchaseOrdersIndex({
  purchaseOrders,
  branches,
  suppliers,
  items,
  units,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  const generatePONumber = () => {
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `PO-${yymmdd}-${rand}`;
  };

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    supplier_id: '',
    po_number: generatePONumber(),
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date().toISOString().split('T')[0],
    items: [{ item_id: '', qty_ordered: 1, unit_id: '', unit_price: 0 }],
  });

  const grandTotal = useMemo(() => {
    return data.items.reduce((sum, row) => {
      return sum + (Number(row.qty_ordered) || 0) * (Number(row.unit_price) || 0);
    }, 0);
  }, [data.items]);

  const openCreateModal = () => {
    setEditingPO(null);
    clearErrors();
    setData({
      branch_id: '',
      supplier_id: '',
      po_number: generatePONumber(),
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: new Date().toISOString().split('T')[0],
      items: [{ item_id: '', qty_ordered: 1, unit_id: '', unit_price: 0 }],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    clearErrors();
    setData({
      branch_id: String(po.branch_id),
      supplier_id: String(po.supplier_id),
      po_number: po.po_number,
      order_date: formatDateInput(po.order_date),
      expected_delivery_date: formatDateInput(po.expected_delivery_date),
      items:
        po.items && po.items.length > 0
          ? po.items.map((i) => ({
              item_id: String(i.item_id),
              qty_ordered: Number(i.qty_ordered),
              unit_id: String(i.unit_id),
              unit_price: Number(i.unit_price),
            }))
          : [{ item_id: '', qty_ordered: 1, unit_id: '', unit_price: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/purchase-orders', { search, status: selectedStatus }, { preserveState: true });
  };

  const handleAddItemRow = () => {
    setData('items', [...data.items, { item_id: '', qty_ordered: 1, unit_id: '', unit_price: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (data.items.length === 1) return;
    const updated = [...data.items];
    updated.splice(index, 1);
    setData('items', updated);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...data.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'item_id') {
      const selectedItem = items.find((i) => i.id === Number(value));
      if (selectedItem?.purchase_unit) {
        updated[index].unit_id = String(selectedItem.purchase_unit.id);
      }
    }

    setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPO) {
      put(`/purchase-orders/${editingPO.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingPO(null);
          reset();
        },
      });
    } else {
      post('/purchase-orders', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleStatusUpdate = (po: PurchaseOrder, newStatus: 'ORDERED' | 'CANCELLED') => {
    const label = newStatus === 'ORDERED' ? 'kirim ke supplier (ORDERED)' : 'batalkan (CANCELLED)';
    if (confirm(`Yakin ingin ${label} untuk PO ${po.po_number}?`)) {
      router.patch(`/purchase-orders/${po.id}/status`, { status: newStatus }, {
        onSuccess: () => setViewingPO(null),
      });
    }
  };

  const handleDelete = (po: PurchaseOrder) => {
    if (confirm(`Hapus permanen Purchase Order ${po.po_number}?`)) {
      router.delete(`/purchase-orders/${po.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Purchase Order (PO)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Order (PO)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengajuan pengadaan bahan baku ke supplier sebelum proses Goods Receipt (GR).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} /> Buat PO Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. PO atau Nama Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            router.get('/purchase-orders', { search, status: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-52 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ORDERED">ORDERED</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. PO</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Tgl Order / Est.</th>
                <th className="py-3.5 px-4 text-right">Total Nominal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {purchaseOrders.data.length > 0 ? (
                purchaseOrders.data.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <button
                        onClick={() => setViewingPO(po)}
                        className="hover:underline text-left"
                      >
                        {po.po_number}
                      </button>
                      <div className="text-[10px] font-sans font-normal text-slate-400">
                        {po.items?.length || 0} item
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {po.branch?.name}
                      <span className="ml-1.5 text-[10px] font-mono text-slate-400">[{po.branch?.code}]</span>
                    </td>
                    <td className="py-3 px-4">{po.supplier?.name}</td>
                    <td className="py-3 px-4">
                      <div>{formatDateInput(po.order_date)}</div>
                      {po.expected_delivery_date && (
                        <div className="text-[10px] text-slate-400">
                          Est: {formatDateInput(po.expected_delivery_date)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(po.total_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[po.status]}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingPO(po)}
                          title="Lihat Detail"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye size={14} />
                        </button>

                        {po.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => openEditModal(po)}
                              title="Edit Draft"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(po, 'ORDERED')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[10px] font-semibold"
                            >
                              <Send size={11} /> Order
                            </button>
                          </>
                        )}

                        {po.status === 'ORDERED' && (
                          <button
                            onClick={() => handleStatusUpdate(po, 'CANCELLED')}
                            title="Batalkan PO"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Ban size={14} />
                          </button>
                        )}

                        {['DRAFT', 'CANCELLED'].includes(po.status) && (
                          <button
                            onClick={() => handleDelete(po)}
                            title="Hapus PO"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada data Purchase Order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {purchaseOrders.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{purchaseOrders.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{purchaseOrders.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{purchaseOrders.total}</span> PO
            </div>
            <div className="flex flex-wrap gap-1">
              {purchaseOrders.links.map((link, idx) => (
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

      {/* Modal Create / Edit PO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">
                {editingPO ? `Edit Purchase Order — ${editingPO.po_number}` : 'Buat Purchase Order (PO) Baru'}
              </h2>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Tujuan *</label>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</label>
                  <select
                    value={data.supplier_id}
                    onChange={(e) => setData('supplier_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplier_id && <p className="text-[11px] text-rose-600 mt-1">{errors.supplier_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. PO *</label>
                  <input
                    type="text"
                    value={data.po_number}
                    onChange={(e) => setData('po_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {errors.po_number && <p className="text-[11px] text-rose-600 mt-1">{errors.po_number}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Order *</label>
                  <input
                    type="date"
                    value={data.order_date}
                    onChange={(e) => setData('order_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {errors.order_date && <p className="text-[11px] text-rose-600 mt-1">{errors.order_date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Tiba</label>
                  <input
                    type="date"
                    value={data.expected_delivery_date}
                    onChange={(e) => setData('expected_delivery_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {errors.expected_delivery_date && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.expected_delivery_date}</p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Daftar Item Pembelian *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    + Tambah Baris Item
                  </button>
                </div>

                {errors.items && <p className="text-[11px] text-rose-600 mb-2">{errors.items}</p>}

                <div className="space-y-2">
                  {data.items.map((row, idx) => {
                    const rowSubtotal = (Number(row.qty_ordered) || 0) * (Number(row.unit_price) || 0);
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <select
                            value={row.item_id}
                            onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="">Pilih SKU Item</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                [{i.sku}] {i.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Qty"
                            value={row.qty_ordered}
                            onChange={(e) => handleItemChange(idx, 'qty_ordered', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <select
                            value={row.unit_id}
                            onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="">Satuan</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.symbol}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Harga"
                            value={row.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                          />
                        </div>

                        <div className="col-span-10 sm:col-span-1 text-right font-mono text-[11px] font-semibold text-slate-700 truncate">
                          {rowSubtotal.toLocaleString('id-ID')}
                        </div>

                        <div className="col-span-2 sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={data.items.length === 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-lg px-4 py-3">
                <span className="text-xs font-semibold text-slate-700">Estimasi Grand Total PO</span>
                <span className="text-sm font-mono font-bold text-indigo-700">{formatRupiah(grandTotal)}</span>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : editingPO ? 'Simpan Perubahan' : 'Simpan Draft PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail PO */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 font-mono">{viewingPO.po_number}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[viewingPO.status]}`}
                >
                  {viewingPO.status}
                </span>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Building2 size={11} /> Cabang
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingPO.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Truck size={11} /> Supplier
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingPO.supplier?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Calendar size={11} /> Tgl Order / Est.
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {formatDateInput(viewingPO.order_date)}
                    {viewingPO.expected_delivery_date ? ` → ${formatDateInput(viewingPO.expected_delivery_date)}` : ''}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">SKU / Item</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingPO.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{item.item?.sku}]</span>
                          <span className="font-medium text-slate-800">{item.item?.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Number(item.qty_ordered)} {item.unit?.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(item.unit_price)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/80 border-t border-slate-200 font-bold">
                      <td colSpan={3} className="py-3 px-3 text-right text-slate-700">
                        Total Nominal PO
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-700">
                        {formatRupiah(viewingPO.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="text-[11px] text-slate-400">
                Dibuat oleh: <span className="font-medium text-slate-600">{viewingPO.creator?.name || 'System'}</span>
              </div>
              <div className="flex gap-2">
                {viewingPO.status === 'DRAFT' && (
                  <button
                    onClick={() => handleStatusUpdate(viewingPO, 'ORDERED')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium"
                  >
                    <Send size={13} /> Kirim ke Supplier (ORDERED)
                  </button>
                )}
                <button
                  onClick={() => setViewingPO(null)}
                  className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}