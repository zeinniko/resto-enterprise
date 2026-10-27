import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, ShoppingCart, Trash2, X, Save, FileText, CheckCircle2, Clock, Ban
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Supplier { id: number; name: string; code: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; purchase_unit?: Unit; }

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
  expected_delivery_date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  branch?: Branch;
  supplier?: Supplier;
  items?: POItem[];
}

interface Props {
  purchaseOrders: {
    data: PurchaseOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches: Branch[];
  suppliers: Supplier[];
  items: Item[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

export default function PurchaseOrdersIndex({ purchaseOrders, branches, suppliers, items, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    branch_id: '',
    supplier_id: '',
    po_number: `PO-${Date.now().toString().slice(-6)}`,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date().toISOString().split('T')[0],
    items: [
      { item_id: '', qty_ordered: 1, unit_id: '', unit_price: 0 }
    ],
  });

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

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...data.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === Number(value));
      if (selectedItem?.purchase_unit) {
        updated[index].unit_id = String(selectedItem.purchase_unit.id);
      }
    }

    setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/purchase-orders', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleStatusUpdate = (po: PurchaseOrder, newStatus: string) => {
    if (confirm(`Ubah status PO ${po.po_number} menjadi ${newStatus}?`)) {
      router.patch(`/purchase-orders/${po.id}/status`, { status: newStatus });
    }
  };

  const handleDelete = (po: PurchaseOrder) => {
    if (confirm(`Hapus Purchase Order ${po.po_number}?`)) {
      router.delete(`/purchase-orders/${po.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Purchase Order (PO)" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Order (PO)</h1>
          <p className="text-xs text-slate-500 mt-1">Pengajuan order pembelian bahan baku ke supplier terdaftar.</p>
        </div>
        <button
          onClick={() => { reset(); clearErrors(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} /> Buat PO Baru
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. PO atau Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            router.get('/purchase-orders', { search, status: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-48 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="RECEIVED">RECEIVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. PO</th>
              <th className="py-3.5 px-4">Cabang</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Tgl Order</th>
              <th className="py-3.5 px-4">Total Nominal</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {purchaseOrders.data.length > 0 ? (
              purchaseOrders.data.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{po.po_number}</td>
                  <td className="py-3 px-4 font-semibold">{po.branch?.name}</td>
                  <td className="py-3 px-4">{po.supplier?.name}</td>
                  <td className="py-3 px-4">{po.order_date}</td>
                  <td className="py-3 px-4 font-mono font-bold">Rp {Number(po.total_amount).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      po.status === 'SUBMITTED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      po.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {po.status === 'DRAFT' && (
                      <button onClick={() => handleStatusUpdate(po, 'SUBMITTED')} className="px-2 py-1 bg-sky-50 text-sky-600 border border-sky-200 rounded text-[10px] font-semibold">
                        Kirim
                      </button>
                    )}
                    {po.status !== 'RECEIVED' && (
                      <button onClick={() => handleDelete(po)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Belum ada Purchase Order.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Buat Purchase Order (PO)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Cabang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</label>
                  <select value={data.supplier_id} onChange={(e) => setData('supplier_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. PO *</label>
                  <input type="text" value={data.po_number} onChange={(e) => setData('po_number', e.target.value)} className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Order *</label>
                  <input type="date" value={data.order_date} onChange={(e) => setData('order_date', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Estimasi *</label>
                  <input type="date" value={data.expected_delivery_date} onChange={(e) => setData('expected_delivery_date', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg" />
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Daftar Item Barang *</label>
                  <button type="button" onClick={handleAddItemRow} className="text-[11px] font-semibold text-indigo-600">+ Tambah Baris</button>
                </div>
                <div className="space-y-2">
                  {data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select value={row.item_id} onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)} className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Pilih Item</option>
                        {items.map(i => <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>)}
                      </select>
                      <input type="number" placeholder="Qty" value={row.qty_ordered} onChange={(e) => handleItemChange(idx, 'qty_ordered', e.target.value)} className="w-16 px-2 py-1.5 text-xs bg-white border rounded-lg font-mono" />
                      <select value={row.unit_id} onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)} className="w-24 px-2 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Satuan</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                      </select>
                      <input type="number" placeholder="Harga" value={row.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)} className="w-28 px-2 py-1.5 text-xs bg-white border rounded-lg font-mono" />
                      <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}