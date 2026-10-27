import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Factory, X, Save, CheckCircle2, Play
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface Recipe { id: number; yield_qty: number; menuItem?: { name: string }; }
interface Item { id: number; name: string; sku: string; }
interface StorageLocation { id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }

interface ProductionOrder {
  id: number;
  production_number: string;
  target_qty: number;
  actual_qty: number | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  production_date: string;
  branch?: Branch;
  recipe?: Recipe;
  targetItem?: Item;
  unit?: Unit;
}

interface Props {
  productionOrders: {
    data: ProductionOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  ckBranches: Branch[];
  recipes: Recipe[];
  targetItems: Item[];
  storageLocations: StorageLocation[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

export default function ProductionOrdersIndex({ productionOrders, ckBranches, recipes, targetItems, storageLocations, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createForm = useForm({
    branch_id: '',
    recipe_id: '',
    target_item_id: '',
    storage_location_id: '',
    production_number: `PROD-${Date.now().toString().slice(-6)}`,
    target_qty: 10,
    unit_id: '',
    production_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/production-orders', {
      onSuccess: () => {
        setIsModalOpen(false);
        createForm.reset();
      },
    });
  };

  return (
    <DashboardLayout>
      <Head title="Produksi Central Kitchen" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Produksi Central Kitchen</h1>
          <p className="text-xs text-slate-500 mt-1">Pengolahan bumbu/bahan setengah jadi dari bahan mentah berbasis resep BOM.</p>
        </div>
        <button
          onClick={() => { createForm.reset(); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Rencana Produksi
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={(e) => { e.preventDefault(); router.get('/production-orders', { search }, { preserveState: true }); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari No. Produksi..."
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
              <th className="py-3.5 px-4">No. Produksi</th>
              <th className="py-3.5 px-4">Dapur CK</th>
              <th className="py-3.5 px-4">Item Target</th>
              <th className="py-3.5 px-4">Target Qty</th>
              <th className="py-3.5 px-4">Hasil Aktual</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {productionOrders.data.length > 0 ? (
              productionOrders.data.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{po.production_number}</td>
                  <td className="py-3 px-4 font-semibold">{po.branch?.name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{po.targetItem?.name}</td>
                  <td className="py-3 px-4 font-mono font-bold">{po.target_qty} {po.unit?.symbol}</td>
                  <td className="py-3 px-4 font-mono">{po.actual_qty ? `${po.actual_qty} ${po.unit?.symbol}` : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      po.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada rencana produksi Central Kitchen.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Buat Order Produksi Central Kitchen</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dapur Central Kitchen *</label>
                  <select value={createForm.data.branch_id} onChange={(e) => createForm.setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih CK</option>
                    {ckBranches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resep BOM Acuan *</label>
                  <select value={createForm.data.recipe_id} onChange={(e) => createForm.setData('recipe_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Resep</option>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.menuItem?.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hasil Barang Jadi (SKU) *</label>
                  <select value={createForm.data.target_item_id} onChange={(e) => createForm.setData('target_item_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Item Hasil</option>
                    {targetItems.map(i => <option key={i.id} value={i.id}>[{i.sku}] {i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Simpan Hasil *</label>
                  <select value={createForm.data.storage_location_id} onChange={(e) => createForm.setData('storage_location_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Pilih Lokasi</option>
                    {storageLocations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Qty *</label>
                  <input type="number" min="1" value={createForm.data.target_qty} onChange={(e) => createForm.setData('target_qty', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select value={createForm.data.unit_id} onChange={(e) => createForm.setData('unit_id', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg">
                    <option value="">Satuan</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Produksi *</label>
                  <input type="date" value={createForm.data.production_date} onChange={(e) => createForm.setData('production_date', e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg" />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={createForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Produksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}