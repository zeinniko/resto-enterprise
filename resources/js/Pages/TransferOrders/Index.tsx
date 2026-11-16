import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, X, ArrowRight, Send, Trash2, Eye, Pencil, PackageCheck, Ban, FileText
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface StorageLocation { id: number; branch_id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; primary_unit?: Unit; }

type TOStatus = 'DRAFT' | 'REQUESTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

interface TOItem {
  id?: number;
  item_id: number;
  qty_requested: number;
  qty_shipped: number;
  qty_received: number;
  unit_id: number;
  item?: Item;
  unit?: Unit;
}

interface TransferOrder {
  id: number;
  transfer_number: string;
  from_branch_id: number;
  to_branch_id: number;
  status: TOStatus;
  shipped_at: string | null;
  received_at: string | null;
  from_branch?: Branch;
  to_branch?: Branch;
  requester?: { id: number; name: string };
  shipper?: { id: number; name: string };
  receiver?: { id: number; name: string };
  items?: TOItem[];
}

interface Props {
  transferOrders: {
    data: TransferOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  storageLocations: StorageLocation[];
  items: Item[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

const STATUS_BADGE: Record<TOStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  REQUESTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_TRANSIT: 'bg-sky-50 text-sky-700 border-sky-200',
  RECEIVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDateTime = (val?: string | null) => {
  if (!val) return '-';
  return val.replace('T', ' ').slice(0, 16);
};

export default function TransferOrdersIndex({
  transferOrders,
  branches,
  storageLocations,
  items,
  units,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTO, setEditingTO] = useState<TransferOrder | null>(null);
  const [receivingTO, setReceivingTO] = useState<TransferOrder | null>(null);
  const [viewingTO, setViewingTO] = useState<TransferOrder | null>(null);

  const generateTRFNumber = () => {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `TRF-${yymmdd}-${rand}`;
  };

  const createForm = useForm({
    from_branch_id: '',
    to_branch_id: '',
    transfer_number: generateTRFNumber(),
    status: 'DRAFT' as 'DRAFT' | 'REQUESTED',
    items: [{ item_id: '', qty_requested: 1, unit_id: '' }],
  });

  const receiveForm = useForm({
    storage_location_id: '',
    items: [] as { id: number; item_name: string; item_sku: string; unit_symbol: string; qty_shipped: number; qty_received: number | string }[],
  });

  const destinationLocations = useMemo(() => {
    if (!receivingTO) return [];
    const filtered = storageLocations.filter((s) => s.branch_id === receivingTO.to_branch_id);
    return filtered.length > 0 ? filtered : storageLocations;
  }, [receivingTO, storageLocations]);

  const openCreateModal = () => {
    setEditingTO(null);
    createForm.clearErrors();
    createForm.setData({
      from_branch_id: '',
      to_branch_id: '',
      transfer_number: generateTRFNumber(),
      status: 'DRAFT',
      items: [{ item_id: '', qty_requested: 1, unit_id: '' }],
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (to: TransferOrder) => {
    setEditingTO(to);
    createForm.clearErrors();
    createForm.setData({
      from_branch_id: String(to.from_branch_id),
      to_branch_id: String(to.to_branch_id),
      transfer_number: to.transfer_number,
      status: to.status === 'REQUESTED' ? 'REQUESTED' : 'DRAFT',
      items:
        to.items && to.items.length > 0
          ? to.items.map((i) => ({
              item_id: String(i.item_id),
              qty_requested: Number(i.qty_requested),
              unit_id: String(i.unit_id),
            }))
          : [{ item_id: '', qty_requested: 1, unit_id: '' }],
    });
    setIsCreateModalOpen(true);
  };

  const openReceiveModal = (to: TransferOrder) => {
    receiveForm.clearErrors();
    const branchLocs = storageLocations.filter((s) => s.branch_id === to.to_branch_id);
    const defaultLoc = (branchLocs[0] || storageLocations[0])?.id || '';

    receiveForm.setData({
      storage_location_id: String(defaultLoc),
      items: (to.items || []).map((i) => ({
        id: i.id!,
        item_name: i.item?.name || 'Item',
        item_sku: i.item?.sku || '-',
        unit_symbol: i.unit?.symbol || '',
        qty_shipped: Number(i.qty_shipped || i.qty_requested),
        qty_received: Number(i.qty_shipped || i.qty_requested),
      })),
    });
    setReceivingTO(to);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/transfer-orders', { search, status: selectedStatus }, { preserveState: true });
  };

  const handleAddItemRow = () => {
    createForm.setData('items', [...createForm.data.items, { item_id: '', qty_requested: 1, unit_id: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (createForm.data.items.length === 1) return;
    const updated = [...createForm.data.items];
    updated.splice(index, 1);
    createForm.setData('items', updated);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...createForm.data.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'item_id') {
      const selectedItem = items.find((i) => i.id === Number(value));
      if (selectedItem?.primary_unit) {
        updated[index].unit_id = String(selectedItem.primary_unit.id);
      }
    }

    createForm.setData('items', updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTO) {
      createForm.put(`/transfer-orders/${editingTO.id}`, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setEditingTO(null);
          createForm.reset();
        },
      });
    } else {
      createForm.post('/transfer-orders', {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          createForm.reset();
        },
      });
    }
  };

  const handleShip = (to: TransferOrder) => {
    if (confirm(`Kirim Transfer Order ${to.transfer_number}? Stok cabang asal (${to.from_branch?.name}) akan dipotong FEFO.`)) {
      router.patch(`/transfer-orders/${to.id}/ship`, {}, {
        onSuccess: () => setViewingTO(null),
      });
    }
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingTO) return;
    receiveForm.patch(`/transfer-orders/${receivingTO.id}/receive`, {
      onSuccess: () => {
        setReceivingTO(null);
        receiveForm.reset();
      },
    });
  };

  const handleCancel = (to: TransferOrder) => {
    if (confirm(`Batalkan Transfer Order ${to.transfer_number}?`)) {
      router.patch(`/transfer-orders/${to.id}/cancel`);
    }
  };

  const handleDelete = (to: TransferOrder) => {
    if (confirm(`Hapus permanen Transfer Order ${to.transfer_number}?`)) {
      router.delete(`/transfer-orders/${to.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Transfer Order Antar-Cabang" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Transfer Order Antar-Cabang</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengiriman dan penerimaan mutasi stok bahan baku antar cabang / Central Kitchen.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Buat Transfer Order
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. Transfer atau Nama Cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            router.get('/transfer-orders', { search, status: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-52 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="RECEIVED">RECEIVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Transfer</th>
                <th className="py-3.5 px-4">Rute Mutasi (Asal → Tujuan)</th>
                <th className="py-3.5 px-4">Waktu Kirim / Terima</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {transferOrders.data.length > 0 ? (
                transferOrders.data.map((to) => (
                  <tr key={to.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <button onClick={() => setViewingTO(to)} className="hover:underline text-left">
                        {to.transfer_number}
                      </button>
                      <div className="text-[10px] font-sans font-normal text-slate-400">
                        {to.items?.length || 0} item
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2 font-semibold text-slate-800">
                        <span>{to.from_branch?.name || '-'}</span>
                        <ArrowRight size={13} className="text-slate-400 shrink-0" />
                        <span className="text-indigo-700">{to.to_branch?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      <div>Kirim: {formatDateTime(to.shipped_at)}</div>
                      <div>Terima: {formatDateTime(to.received_at)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[to.status]}`}
                      >
                        {to.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingTO(to)}
                          title="Detail Transfer"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye size={14} />
                        </button>

                        {['DRAFT', 'REQUESTED'].includes(to.status) && (
                          <>
                            <button
                              onClick={() => openEditModal(to)}
                              title="Edit TO"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleShip(to)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[11px] font-semibold"
                            >
                              <Send size={11} /> Kirim
                            </button>
                            <button
                              onClick={() => handleCancel(to)}
                              title="Batalkan TO"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Ban size={14} />
                            </button>
                          </>
                        )}

                        {to.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => openReceiveModal(to)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold"
                          >
                            <PackageCheck size={12} /> Terima Stok
                          </button>
                        )}

                        {['DRAFT', 'CANCELLED'].includes(to.status) && (
                          <button
                            onClick={() => handleDelete(to)}
                            title="Hapus TO"
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
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Belum ada riwayat Transfer Order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transferOrders.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{transferOrders.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{transferOrders.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{transferOrders.total}</span> Transfer Order
            </div>
            <div className="flex flex-wrap gap-1">
              {transferOrders.links.map((link, idx) => (
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

      {/* Modal Create / Edit TO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">
                {editingTO ? `Edit Transfer Order — ${editingTO.transfer_number}` : 'Buat Transfer Order Antar-Cabang'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {(createForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {(createForm.errors as Record<string, string>).message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Asal (Pengirim) *</label>
                  <select
                    value={createForm.data.from_branch_id}
                    onChange={(e) => createForm.setData('from_branch_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Cabang Asal</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.from_branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.from_branch_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Tujuan (Penerima) *</label>
                  <select
                    value={createForm.data.to_branch_id}
                    onChange={(e) => createForm.setData('to_branch_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Cabang Tujuan</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.to_branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.to_branch_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Transfer *</label>
                  <input
                    type="text"
                    value={createForm.data.transfer_number}
                    onChange={(e) => createForm.setData('transfer_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {createForm.errors.transfer_number && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.transfer_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={createForm.data.status}
                    onChange={(e) => createForm.setData('status', e.target.value as 'DRAFT' | 'REQUESTED')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="DRAFT">DRAFT (Konsep)</option>
                    <option value="REQUESTED">REQUESTED (Permintaan Cabang)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Item Bahan yang Ditransfer *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    + Tambah Item
                  </button>
                </div>

                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={row.item_id}
                        onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Item</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            [{i.sku}] {i.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        value={row.qty_requested}
                        onChange={(e) => handleItemChange(idx, 'qty_requested', e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                      />
                      <select
                        value={row.unit_id}
                        onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)}
                        className="w-28 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Satuan</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.symbol}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={createForm.data.items.length === 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {createForm.processing ? 'Menyimpan...' : editingTO ? 'Simpan Perubahan' : 'Simpan Transfer Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Receive TO (Cabang Tujuan) */}
      {receivingTO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Terima Mutasi Stok — <span className="font-mono text-indigo-600">{receivingTO.transfer_number}</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dari {receivingTO.from_branch?.name} ke {receivingTO.to_branch?.name}
                </p>
              </div>
              <button onClick={() => setReceivingTO(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Penyimpanan di {receivingTO.to_branch?.name} *
                </label>
                <select
                  value={receiveForm.data.storage_location_id}
                  onChange={(e) => receiveForm.setData('storage_location_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">Pilih Gudang / Storage Cabang Tujuan</option>
                  {destinationLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {receiveForm.errors.storage_location_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{receiveForm.errors.storage_location_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Konfirmasi Kuantitas Diterima</label>
                {receiveForm.data.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{item.item_sku}]</span>
                        {item.item_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Dikirim: <strong className="font-mono">{item.qty_shipped} {item.unit_symbol}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.qty_received}
                        onChange={(e) => {
                          const updated = [...receiveForm.data.items];
                          updated[idx].qty_received = e.target.value;
                          receiveForm.setData('items', updated);
                        }}
                        className="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                      />
                      <span className="text-xs font-medium text-slate-500 w-10">{item.unit_symbol}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceivingTO(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={receiveForm.processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  <PackageCheck size={14} />
                  {receiveForm.processing ? 'Memproses...' : 'Konfirmasi Terima Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail TO */}
      {viewingTO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 font-mono">{viewingTO.transfer_number}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[viewingTO.status]}`}>
                  {viewingTO.status}
                </span>
              </div>
              <button onClick={() => setViewingTO(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang Asal (Pengirim)</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingTO.from_branch?.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Dikirim: {formatDateTime(viewingTO.shipped_at)} ({viewingTO.shipper?.name || '-'})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang Tujuan (Penerima)</div>
                  <div className="font-semibold text-indigo-700 mt-0.5">{viewingTO.to_branch?.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Diterima: {formatDateTime(viewingTO.received_at)} ({viewingTO.receiver?.name || '-'})
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">SKU / Item</th>
                      <th className="py-2.5 px-3 text-right">Diminta</th>
                      <th className="py-2.5 px-3 text-right">Dikirim</th>
                      <th className="py-2.5 px-3 text-right">Diterima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingTO.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{item.item?.sku}]</span>
                          <span className="font-medium text-slate-800">{item.item?.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Number(item.qty_requested)} {item.unit?.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sky-700">
                          {Number(item.qty_shipped)} {item.unit?.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {Number(item.qty_received)} {item.unit?.symbol}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="text-[11px] text-slate-400">
                Dibuat oleh: <span className="font-medium text-slate-600">{viewingTO.requester?.name || 'System'}</span>
              </div>
              <div className="flex gap-2">
                {['DRAFT', 'REQUESTED'].includes(viewingTO.status) && (
                  <button
                    onClick={() => handleShip(viewingTO)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium"
                  >
                    <Send size={13} /> Kirim Stok (IN_TRANSIT)
                  </button>
                )}
                {viewingTO.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => {
                      const target = viewingTO;
                      setViewingTO(null);
                      openReceiveModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
                  >
                    <PackageCheck size={13} /> Terima Stok
                  </button>
                )}
                <button
                  onClick={() => setViewingTO(null)}
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