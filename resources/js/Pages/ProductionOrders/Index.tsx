import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, X, CheckCircle2, Play, Eye, Ban, Trash2, FileText, Layers
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface StorageLocation { id: number; branch_id: number; name: string; }
interface Unit { id: number; name: string; symbol: string; }
interface Item { id: number; name: string; sku: string; primary_unit?: Unit; }

interface RecipeItem {
  id: number;
  item_id: number;
  quantity: number;
  unit_id: number;
  item?: Item;
  unit?: Unit;
}

interface Recipe {
  id: number;
  yield_qty: number;
  menu_item?: { id: number; name: string };
  recipe_items?: RecipeItem[];
}

type ProdStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface ProductionOrderItem {
  id: number;
  item_id: number;
  qty_required: number;
  qty_used: number;
  unit_id: number;
  item?: Item;
  unit?: Unit;
}

interface ProductionOrder {
  id: number;
  production_number: string;
  target_qty: number;
  actual_qty: number;
  status: ProdStatus;
  production_date: string;
  branch?: Branch;
  recipe?: Recipe;
  target_item?: Item;
  storage_location?: StorageLocation;
  unit?: Unit;
  creator?: { id: number; name: string };
  items?: ProductionOrderItem[];
}

interface Props {
  productionOrders: {
    data: ProductionOrder[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  ckBranches: Branch[];
  recipes: Recipe[];
  targetItems: Item[];
  storageLocations: StorageLocation[];
  units: Unit[];
  filters: { search?: string; status?: string };
}

const STATUS_BADGE: Record<ProdStatus, string> = {
  PLANNED: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDateOnly = (val?: string | null) => {
  if (!val) return '-';
  return val.split('T')[0];
};

export default function ProductionOrdersIndex({
  productionOrders,
  ckBranches,
  recipes,
  targetItems,
  storageLocations,
  units,
  filters,
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completingPO, setCompletingPO] = useState<ProductionOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<ProductionOrder | null>(null);

  const generateProdNumber = () => {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `PROD-${yymmdd}-${rand}`;
  };

  const createForm = useForm({
    branch_id: '',
    recipe_id: '',
    target_item_id: '',
    storage_location_id: '',
    production_number: generateProdNumber(),
    target_qty: 10 as number | string,
    unit_id: '',
    production_date: new Date().toISOString().split('T')[0],
  });

  const completeForm = useForm({
    actual_qty: 0 as number | string,
    exp_date: '',
    items: [] as { id: number; item_name: string; item_sku: string; unit_symbol: string; qty_required: number; qty_used: number | string }[],
  });

  const filteredLocations = useMemo(() => {
    if (!createForm.data.branch_id) return storageLocations;
    const branchLocs = storageLocations.filter(
      (s) => s.branch_id === Number(createForm.data.branch_id)
    );
    return branchLocs.length > 0 ? branchLocs : storageLocations;
  }, [createForm.data.branch_id, storageLocations]);

  const bomPreview = useMemo(() => {
    const recipe = recipes.find((r) => r.id === Number(createForm.data.recipe_id));
    if (!recipe || !recipe.recipe_items) return [];
    const yieldQty = Math.max(Number(recipe.yield_qty) || 1, 1);
    const multiplier = (Number(createForm.data.target_qty) || 0) / yieldQty;

    return recipe.recipe_items.map((ri) => ({
      name: ri.item?.name || 'Bahan',
      sku: ri.item?.sku || '-',
      qty: Number((Number(ri.quantity) * multiplier).toFixed(4)),
      symbol: ri.unit?.symbol || '',
    }));
  }, [createForm.data.recipe_id, createForm.data.target_qty, recipes]);

  const openCreateModal = () => {
    createForm.clearErrors();
    createForm.setData({
      branch_id: ckBranches.length === 1 ? String(ckBranches[0].id) : '',
      recipe_id: '',
      target_item_id: '',
      storage_location_id: '',
      production_number: generateProdNumber(),
      target_qty: 10,
      unit_id: '',
      production_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleTargetItemChange = (itemId: string) => {
    const found = targetItems.find((i) => i.id === Number(itemId));
    createForm.setData((prev) => ({
      ...prev,
      target_item_id: itemId,
      unit_id: found?.primary_unit ? String(found.primary_unit.id) : prev.unit_id,
    }));
  };

  const openCompleteModal = (po: ProductionOrder) => {
    completeForm.clearErrors();
    completeForm.setData({
      actual_qty: Number(po.target_qty),
      exp_date: '',
      items: (po.items || []).map((i) => ({
        id: i.id,
        item_name: i.item?.name || 'Bahan',
        item_sku: i.item?.sku || '-',
        unit_symbol: i.unit?.symbol || '',
        qty_required: Number(i.qty_required),
        qty_used: Number(i.qty_required),
      })),
    });
    setCompletingPO(po);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/production-orders', {
      onSuccess: () => {
        setIsModalOpen(false);
        createForm.reset();
      },
    });
  };

  const handleStart = (po: ProductionOrder) => {
    if (confirm(`Mulai proses produksi ${po.production_number}?`)) {
      router.patch(`/production-orders/${po.id}/start`, {}, {
        onSuccess: () => setViewingPO(null),
      });
    }
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingPO) return;
    completeForm.patch(`/production-orders/${completingPO.id}/complete`, {
      onSuccess: () => {
        setCompletingPO(null);
        completeForm.reset();
      },
    });
  };

  const handleCancel = (po: ProductionOrder) => {
    if (confirm(`Batalkan rencana produksi ${po.production_number}?`)) {
      router.patch(`/production-orders/${po.id}/cancel`);
    }
  };

  const handleDelete = (po: ProductionOrder) => {
    if (confirm(`Hapus permanen order produksi ${po.production_number}?`)) {
      router.delete(`/production-orders/${po.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Produksi Central Kitchen" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Produksi Central Kitchen</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengolahan bumbu & bahan setengah jadi dari bahan mentah berbasis resep BOM & stok FEFO.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Rencana Produksi
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.get('/production-orders', { search, status: selectedStatus }, { preserveState: true });
          }}
          className="relative w-full sm:w-80"
        >
          <input
            type="text"
            placeholder="Cari No. Produksi atau Item Hasil..."
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
            router.get('/production-orders', { search, status: e.target.value }, { preserveState: true });
          }}
          className="w-full sm:w-52 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
        >
          <option value="">Semua Status</option>
          <option value="PLANNED">PLANNED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
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
                <th className="py-3.5 px-4">No. Produksi</th>
                <th className="py-3.5 px-4">Dapur CK</th>
                <th className="py-3.5 px-4">Item Hasil / Resep</th>
                <th className="py-3.5 px-4 text-right">Target Qty</th>
                <th className="py-3.5 px-4 text-right">Hasil Aktual</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {productionOrders.data.length > 0 ? (
                productionOrders.data.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <button onClick={() => setViewingPO(po)} className="hover:underline text-left">
                        {po.production_number}
                      </button>
                      <div className="text-[10px] font-sans font-normal text-slate-400">
                        {formatDateOnly(po.production_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{po.branch?.name}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{po.target_item?.name || '-'}</div>
                      <div className="text-[10px] text-slate-400">
                        Resep: {po.recipe?.menu_item?.name || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {Number(po.target_qty)} {po.unit?.symbol}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {po.status === 'COMPLETED' && Number(po.actual_qty) > 0
                        ? `${Number(po.actual_qty)} ${po.unit?.symbol}`
                        : '-'}
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
                          title="Detail BOM & Bahan"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye size={14} />
                        </button>

                        {po.status === 'PLANNED' && (
                          <button
                            onClick={() => handleStart(po)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[11px] font-semibold"
                          >
                            <Play size={11} /> Mulai
                          </button>
                        )}

                        {['PLANNED', 'IN_PROGRESS'].includes(po.status) && (
                          <>
                            <button
                              onClick={() => openCompleteModal(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold"
                            >
                              <CheckCircle2 size={12} /> Selesai
                            </button>
                            <button
                              onClick={() => handleCancel(po)}
                              title="Batalkan Produksi"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Ban size={14} />
                            </button>
                          </>
                        )}

                        {['PLANNED', 'CANCELLED'].includes(po.status) && (
                          <button
                            onClick={() => handleDelete(po)}
                            title="Hapus"
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
                    Belum ada rencana produksi Central Kitchen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {productionOrders.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{productionOrders.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{productionOrders.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{productionOrders.total}</span> Produksi
            </div>
            <div className="flex flex-wrap gap-1">
              {productionOrders.links.map((link, idx) => (
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

      {/* Modal Create Rencana Produksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Buat Rencana Produksi Central Kitchen</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Produksi *</label>
                  <input
                    type="text"
                    value={createForm.data.production_number}
                    onChange={(e) => createForm.setData('production_number', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  {createForm.errors.production_number && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.production_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dapur Central Kitchen *</label>
                  <select
                    value={createForm.data.branch_id}
                    onChange={(e) =>
                      createForm.setData((prev) => ({
                        ...prev,
                        branch_id: e.target.value,
                        storage_location_id: '',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Dapur CK / HQ</option>
                    {ckBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.branch_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resep BOM Acuan *</label>
                  <select
                    value={createForm.data.recipe_id}
                    onChange={(e) => createForm.setData('recipe_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Resep BOM</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.menu_item?.name || `Resep #${r.id}`} (Yield: {Number(r.yield_qty)})
                      </option>
                    ))}
                  </select>
                  {createForm.errors.recipe_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.recipe_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Hasil Jadi (SKU) *</label>
                  <select
                    value={createForm.data.target_item_id}
                    onChange={(e) => handleTargetItemChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Item Hasil Produksi</option>
                    {targetItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        [{i.sku}] {i.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.target_item_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.target_item_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Simpan Hasil *</label>
                  <select
                    value={createForm.data.storage_location_id}
                    onChange={(e) => createForm.setData('storage_location_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Lokasi Penyimpanan</option>
                    {filteredLocations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.storage_location_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.storage_location_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Qty *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={createForm.data.target_qty}
                    onChange={(e) => createForm.setData('target_qty', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-right"
                  />
                  {createForm.errors.target_qty && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.target_qty}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select
                    value={createForm.data.unit_id}
                    onChange={(e) => createForm.setData('unit_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Satuan</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.symbol}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.unit_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.unit_id}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Produksi *</label>
                <input
                  type="date"
                  value={createForm.data.production_date}
                  onChange={(e) => createForm.setData('production_date', e.target.value)}
                  className="w-full sm:w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
                {createForm.errors.production_date && (
                  <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.production_date}</p>
                )}
              </div>

              {/* Preview Estimasi Bahan Baku dari Resep BOM */}
              {bomPreview.length > 0 && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                    <Layers size={14} /> Estimasi Kebutuhan Bahan Baku (BOM)
                  </div>
                  <div className="divide-y divide-indigo-100 text-xs">
                    {bomPreview.map((b, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="text-slate-700">
                          <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{b.sku}]</span>
                          {b.name}
                        </span>
                        <span className="font-mono font-semibold text-indigo-700">
                          {b.qty} {b.symbol}
                        </span>
                      </div>
                    ))}
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
                  disabled={createForm.processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan Rencana Produksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Complete Produksi */}
      {completingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Selesaikan Produksi — <span className="font-mono text-indigo-600">{completingPO.production_number}</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hasil: <strong>{completingPO.target_item?.name}</strong> (Target: {Number(completingPO.target_qty)} {completingPO.unit?.symbol})
                </p>
              </div>
              <button onClick={() => setCompletingPO(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {(completeForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {(completeForm.errors as Record<string, string>).message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hasil Produksi Aktual ({completingPO.unit?.symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={completeForm.data.actual_qty}
                    onChange={(e) => completeForm.setData('actual_qty', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-right"
                  />
                  {completeForm.errors.actual_qty && (
                    <p className="text-[11px] text-rose-600 mt-1">{completeForm.errors.actual_qty}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Expired Batch Hasil (FEFO)
                  </label>
                  <input
                    type="date"
                    value={completeForm.data.exp_date}
                    onChange={(e) => completeForm.setData('exp_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Konfirmasi Pemakaian Bahan Baku Aktual (Dipotong FEFO)
                </label>
                {completeForm.data.items.map((item, idx) => (
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
                        Standar Resep: <strong className="font-mono">{item.qty_required} {item.unit_symbol}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.qty_used}
                        onChange={(e) => {
                          const updated = [...completeForm.data.items];
                          updated[idx].qty_used = e.target.value;
                          completeForm.setData('items', updated);
                        }}
                        className="w-28 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                      />
                      <span className="text-xs font-medium text-slate-500 w-10">{item.unit_symbol}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingPO(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={completeForm.processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {completeForm.processing ? 'Memproses...' : 'Selesaikan & Catat Stok Hasil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Produksi */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 font-mono">{viewingPO.production_number}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[viewingPO.status]}`}>
                  {viewingPO.status}
                </span>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Dapur CK</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingPO.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Item Hasil</div>
                  <div className="font-semibold text-indigo-700 mt-0.5">{viewingPO.target_item?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Simpan</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingPO.storage_location?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Target / Aktual</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">
                    {Number(viewingPO.target_qty)} /{' '}
                    {viewingPO.status === 'COMPLETED' ? Number(viewingPO.actual_qty) : '-'} {viewingPO.unit?.symbol}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">SKU / Bahan Baku</th>
                      <th className="py-2.5 px-3 text-right">Kebutuhan Resep</th>
                      <th className="py-2.5 px-3 text-right">Terpakai Aktual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingPO.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{item.item?.sku}]</span>
                          <span className="font-medium text-slate-800">{item.item?.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {Number(item.qty_required)} {item.unit?.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {Number(item.qty_used)} {item.unit?.symbol}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="text-[11px] text-slate-400">
                Dibuat oleh: <span className="font-medium text-slate-600">{viewingPO.creator?.name || 'System'}</span>
              </div>
              <div className="flex gap-2">
                {['PLANNED', 'IN_PROGRESS'].includes(viewingPO.status) && (
                  <button
                    onClick={() => {
                      const target = viewingPO;
                      setViewingPO(null);
                      openCompleteModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
                  >
                    <CheckCircle2 size={13} /> Selesaikan Produksi
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