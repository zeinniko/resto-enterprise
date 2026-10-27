import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Truck, X, Save, ArrowRight, CheckCircle2, Send, Trash2
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; primaryUnit?: Unit; }

interface TOItem {
  id?: number;
  item_id: number;
  qty_requested: number;
  qty_shipped?: number;
  qty_received?: number;
  unit_id: number;
  item?: Item;
  unit?: Unit;
}

interface TransferOrder {
  id: number;
  transfer_number: string;
  status: 'DRAFT' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  fromBranch?: Branch;
  toBranch?: Branch;
  items?: TOItem[];
}

interface Props {
  transferOrders: {
    data: TransferOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches: Branch[];
  items: Item[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

export default function TransferOrdersIndex({ transferOrders, branches, items, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const createForm = useForm({
    from_branch_id: '',
    to_branch_id: '',
    transfer_number: `TRF-${Date.now().toString().slice(-6)}`,
    items: [{ item_id: '', qty_requested: 1, unit_id: '' }],
  });

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

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...createForm.data.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === Number(value));
      if (selectedItem?.primaryUnit) {
        updated[index].unit_id = String(selectedItem.primaryUnit.id);
      }
    }

    createForm.setData('items', updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/transfer-orders', {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createForm.reset();
      },
    });
  };

  const handleShip = (to: TransferOrder) => {
    if (confirm(`Kirim Transfer Order ${to.transfer_number}? Stok cabang asal akan dipotong.`)) {
      router.patch(`/transfer-orders/${to.id}/ship`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Transfer Order Antar-Cabang" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Transfer Order Antar-Cabang</h1>
          <p className="text-xs text-slate-500 mt-1">Pengiriman dan penerimaan mutasi stok bahan baku antar cabang/Central Kitchen.</p>
        </div>
        <button
          onClick={() => { createForm.reset(); setIsCreateModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Buat Transfer Order
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. Transfer..."
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
            router.get('/transfer-orders', { search, status: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-48 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="RECEIVED">RECEIVED</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. Transfer</th>
              <th className="py-3.5 px-4">Cabang Asal</th>
              <th className="py-3.5 px-4">Cabang Tujuan</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {transferOrders.data.length > 0 ? (
              transferOrders.data.map((to) => (
                <tr key={to.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{to.transfer_number}</td>
                  <td className="py-3 px-4 font-semibold">{to.fromBranch?.name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{to.toBranch?.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      to.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      to.status === 'SHIPPED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {to.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {to.status === 'DRAFT' && (
                      <button onClick={() => handleShip(to)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-600 border border-sky-200 rounded text-[11px] font-semibold">
                        <Send size={12} /> Kirim Stok
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada riwayat Transfer Order.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Buat Transfer Order Antar-Cabang</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Asal *</label>
                  <select value={createForm.data.from_branch_id} onChange={(e) => createForm.setData('from_branch_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Asal</option>
                    {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Tujuan *</label>
                  <select value={createForm.data.to_branch_id} onChange={(e) => createForm.setData('to_branch_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Tujuan</option>
                    {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. Transfer *</label>
                <input type="text" value={createForm.data.transfer_number} onChange={(e) => createForm.setData('transfer_number', e.target.value)} className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border rounded-lg" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Item Bahan yang Ditransfer *</label>
                  <button type="button" onClick={handleAddItemRow} className="text-[11px] font-semibold text-indigo-600">+ Tambah Item</button>
                </div>
                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select value={row.item_id} onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)} className="flex-1 px-2.5 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Pilih Item</option>
                        {items.map(i => <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>)}
                      </select>
                      <input type="number" placeholder="Qty" value={row.qty_requested} onChange={(e) => handleItemChange(idx, 'qty_requested', e.target.value)} className="w-20 px-2 py-1.5 text-xs bg-white border rounded-lg font-mono" />
                      <select value={row.unit_id} onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)} className="w-28 px-2 py-1.5 text-xs bg-white border rounded-lg">
                        <option value="">Satuan</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                      </select>
                      <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={createForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan TO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}