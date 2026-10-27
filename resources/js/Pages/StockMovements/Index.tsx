import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { Search, ArrowLeftRight, Layers } from 'lucide-react';

interface StockMovement {
  id: number;
  movement_type: string;
  qty: number;
  created_at: string;
  branch?: { name: string };
  item?: { name: string; sku: string };
  stockBatch?: { batch_number: string };
  fromLocation?: { name: string };
  toLocation?: { name: string };
  unit?: { symbol: string };
  creator?: { name: string };
}

interface Props {
  movements: {
    data: StockMovement[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  branches: { id: number; name: string; code: string }[];
  filters: { search?: string; movement_type?: string; branch_id?: string };
}

export default function StockMovementsIndex({ movements, branches, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState(filters.movement_type || '');

  return (
    <DashboardLayout>
      <Head title="Pergerakan Stok Ledger" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pergerakan Stok (Audit Ledger)</h1>
          <p className="text-xs text-slate-500 mt-1">Audit trail seluruh mutasi barang masuk, keluar, waste, dan penyesuaian opname.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={(e) => { e.preventDefault(); router.get('/stock-movements', { search, movement_type: selectedType }, { preserveState: true }); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari SKU, Item, atau No. Batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            router.get('/stock-movements', { search, movement_type: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-56 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Jenis Pergerakan</option>
          <option value="IN_PURCHASE">Penerimaan PO (IN)</option>
          <option value="OUT_POS">Penjualan POS (OUT)</option>
          <option value="IN_TRANSFER">Transfer Masuk (IN)</option>
          <option value="OUT_TRANSFER">Transfer Keluar (OUT)</option>
          <option value="OUT_PRODUCTION">Bahan Produksi (OUT)</option>
          <option value="IN_PRODUCTION">Hasil Produksi (IN)</option>
          <option value="WASTE">Waste / Rusak (OUT)</option>
          <option value="ADJUSTMENT_IN">Opname Surplus (IN)</option>
          <option value="ADJUSTMENT_OUT">Opname Defisit (OUT)</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Tgl & Waktu</th>
              <th className="py-3.5 px-4">Tipe Pergerakan</th>
              <th className="py-3.5 px-4">Item SKU</th>
              <th className="py-3.5 px-4">No. Batch</th>
              <th className="py-3.5 px-4">Alur Lokasi</th>
              <th className="py-3.5 px-4 font-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {movements.data.length > 0 ? (
              movements.data.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-500">{new Date(m.created_at).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 font-semibold">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      m.movement_type.startsWith('IN') || m.movement_type === 'ADJUSTMENT_IN' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{m.item?.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-600">{m.stockBatch?.batch_number || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.fromLocation ? m.fromLocation.name : 'Eksternal'} $\rightarrow$ {m.toLocation ? m.toLocation.name : 'Eksternal'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-right">{m.qty} {m.unit?.symbol}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada riwayat pergerakan stok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}