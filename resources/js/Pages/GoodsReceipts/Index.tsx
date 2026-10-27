import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, ShoppingBag, X, Save, Calendar, Warehouse, ShieldCheck
} from 'lucide-react';

interface StorageLocation { id: number; name: string; }
interface Item { id: number; name: string; sku: string; }
interface Unit { id: number; name: string; symbol: string; }

interface POItem {
  item_id: number;
  qty_ordered: number;
  unit_id: number;
  unit_price: number;
  item?: Item;
  unit?: Unit;
}

interface ApprovedPO {
  id: number;
  po_number: string;
  branch_id: number;
  supplier?: { name: string };
  items?: POItem[];
}

interface GoodsReceipt {
  id: number;
  receipt_number: string;
  received_date: string;
  notes: string | null;
  branch?: { name: string };
  purchaseOrder?: { po_number: string; supplier?: { name: string } };
}

interface Props {
  goodsReceipts: {
    data: GoodsReceipt[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  approvedPOs: ApprovedPO[];
  storageLocations: StorageLocation[];
  filters: { search?: string };
}

export default function GoodsReceiptsIndex({ goodsReceipts, approvedPOs, storageLocations, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    purchase_order_id: '',
    receipt_number: `GR-${Date.now().toString().slice(-6)}`,
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as any[],
  });

  const handlePOSelect = (poId: string) => {
    setData('purchase_order_id', poId);
    const selectedPO = approvedPOs.find(p => p.id === Number(poId));
    if (selectedPO?.items) {
      const itemsList = selectedPO.items.map(i => ({
        item_id: i.item_id,
        storage_location_id: storageLocations[0]?.id || '',
        qty_received: i.qty_ordered,
        unit_id: i.unit_id,
        unit_cost: i.unit_price,
        exp_date: '',
        batch_number: `BATCH-${Date.now().toString().slice(-4)}`,
        item_name: i.item?.name,
        unit_symbol: i.unit?.symbol,
      }));
      setData(prev => ({ ...prev, purchase_order_id: poId, items: itemsList }));
    }
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Penerimaan Barang (Goods Receipt)</h1>
          <p className="text-xs text-slate-500 mt-1">Penerimaan stok dari supplier berdasarkan PO dan pencatatan Batch FEFO.</p>
        </div>
        <button
          onClick={() => { reset(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Terima Barang (GR)
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={(e) => { e.preventDefault(); router.get('/goods-receipts', { search }, { preserveState: true }); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. GR atau No. PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. Penerimaan (GR)</th>
              <th className="py-3.5 px-4">Referensi PO</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Tgl Diterima</th>
              <th className="py-3.5 px-4">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {goodsReceipts.data.length > 0 ? (
              goodsReceipts.data.map((gr) => (
                <tr key={gr.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{gr.receipt_number}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{gr.purchaseOrder?.po_number}</td>
                  <td className="py-3 px-4 font-semibold">{gr.purchaseOrder?.supplier?.name}</td>
                  <td className="py-3 px-4">{gr.received_date}</td>
                  <td className="py-3 px-4 text-slate-500">{gr.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada riwayat penerimaan barang.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal GR Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Proses Penerimaan Barang (GR)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih PO *</label>
                  <select value={data.purchase_order_id} onChange={(e) => handlePOSelect(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih PO Disetujui</option>
                    {approvedPOs.map(p => <option key={p.id} value={p.id}>[{p.po_number}] {p.supplier?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. GR *</label>
                  <input type="text" value={data.receipt_number} onChange={(e) => setData('receipt_number', e.target.value)} className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Penerimaan *</label>
                  <input type="date" value={data.received_date} onChange={(e) => setData('received_date', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg" />
                </div>
              </div>

              {/* Items Receiving Details */}
              {data.items.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-800">Verifikasi Item & Input Batch FEFO</label>
                  {data.items.map((row, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-xs text-indigo-700">
                        <span>{row.item_name}</span>
                        <span>Satuan: {row.unit_symbol}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500">Qty Diterima</label>
                          <input type="number" value={row.qty_received} onChange={(e) => {
                            const updated = [...data.items];
                            updated[idx].qty_received = e.target.value;
                            setData('items', updated);
                          }} className="w-full px-2 py-1 text-xs bg-white border rounded font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">Lokasi Simpan</label>
                          <select value={row.storage_location_id} onChange={(e) => {
                            const updated = [...data.items];
                            updated[idx].storage_location_id = e.target.value;
                            setData('items', updated);
                          }} className="w-full px-2 py-1 text-xs bg-white border rounded">
                            {storageLocations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">No. Batch *</label>
                          <input type="text" value={row.batch_number} onChange={(e) => {
                            const updated = [...data.items];
                            updated[idx].batch_number = e.target.value;
                            setData('items', updated);
                          }} className="w-full px-2 py-1 text-xs bg-white border rounded font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">Tgl Expired</label>
                          <input type="date" value={row.exp_date} onChange={(e) => {
                            const updated = [...data.items];
                            updated[idx].exp_date = e.target.value;
                            setData('items', updated);
                          }} className="w-full px-2 py-1 text-xs bg-white border rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing || data.items.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Proses Penerimaan & Stok FEFO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}