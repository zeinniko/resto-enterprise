import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, UtensilsCrossed, Layers, Trash, BookOpen
} from 'lucide-react';

interface Unit { id: number; name: string; symbol: string; }
interface RawItem { id: number; name: string; sku: string; primary_unit?: Unit; }
interface MenuItem { id: number; name: string; code: string; }

interface RecipeItemDetail {
  id?: number;
  item_id: number;
  quantity: number;
  unit_id: number;
  waste_percentage: number;
  item?: RawItem;
  unit?: Unit;
}

interface Recipe {
  id: number;
  menu_item_id: number;
  yield_qty: number;
  instructions: string | null;
  is_active: boolean;
  menu_item?: MenuItem;
  recipe_items?: RecipeItemDetail[];
}

interface Props {
  recipes: {
    data: Recipe[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  availableMenuItems: MenuItem[];
  rawItems: RawItem[];
  units: Unit[];
  filters: { search?: string };
}

export default function RecipesIndex({ recipes, availableMenuItems, rawItems, units, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    menu_item_id: '',
    yield_qty: 1,
    instructions: '',
    is_active: true,
    items: [
      { item_id: '', quantity: '', unit_id: '', waste_percentage: 0 }
    ],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/recipes', { search }, { preserveState: true });
  };

  const handleOpenModal = (recipe: Recipe | null = null) => {
    setEditingRecipe(recipe);
    if (recipe) {
      setData({
        menu_item_id: String(recipe.menu_item_id),
        yield_qty: recipe.yield_qty,
        instructions: recipe.instructions || '',
        is_active: recipe.is_active,
        items: recipe.recipe_items ? recipe.recipe_items.map(r => ({
          item_id: String(r.item_id),
          quantity: String(r.quantity),
          unit_id: String(r.unit_id),
          waste_percentage: r.waste_percentage,
        })) : [{ item_id: '', quantity: '', unit_id: '', waste_percentage: 0 }],
      });
    } else {
      reset();
    }
    clearErrors();
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setData('items', [
      ...data.items,
      { item_id: '', quantity: '', unit_id: '', waste_percentage: 0 }
    ]);
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
    
    // Auto populate unit_id jika memilih item
    if (field === 'item_id') {
      const selectedRaw = rawItems.find(r => r.id === Number(value));
      if (selectedRaw && selectedRaw.primary_unit) {
        updated[index].unit_id = String(selectedRaw.primary_unit.id);
      }
    }

    setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecipe) {
      put(`/recipes/${editingRecipe.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/recipes', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (recipe: Recipe) => {
    if (confirm(`Hapus resep untuk menu "${recipe.menu_item?.name}"?`)) {
      router.delete(`/recipes/${recipe.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Resep Bahan (BOM)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resep Bahan / BOM (Bill of Materials)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan racikan bahan baku terpotong per porsi menu untuk otomatisasi stok FEFO.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Buat Resep Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari menu terdaftar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Recipes Cards/Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.data.length > 0 ? (
          recipes.data.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {recipe.menu_item?.code}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 mt-1">{recipe.menu_item?.name}</h2>
                  <p className="text-[11px] text-slate-500">Output Standard: {recipe.yield_qty} Porsi</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenModal(recipe)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(recipe)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Composition List */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Komposisi Bahan baku</h3>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200/60">
                  {recipe.recipe_items?.map((ri, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{ri.item?.name}</span>
                      <span className="font-mono font-bold text-indigo-600">
                        {ri.quantity} {ri.unit?.symbol} {ri.waste_percentage > 0 ? `(Waste ${ri.waste_percentage}%)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            Belum ada resep BOM terdaftar.
          </div>
        )}
      </div>

      {/* Modal CRUD Resep */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingRecipe ? `Edit Resep: ${editingRecipe.menu_item?.name}` : 'Buat Resep Baru (BOM)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Menu Penjualan *</label>
                  {editingRecipe ? (
                    <input
                      type="text"
                      disabled
                      value={editingRecipe.menu_item?.name}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                    />
                  ) : (
                    <select
                      value={data.menu_item_id}
                      onChange={(e) => setData('menu_item_id', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Pilih Menu Penjualan</option>
                      {availableMenuItems.map((m) => (
                        <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.menu_item_id && <p className="text-[10px] text-rose-500 mt-1">{errors.menu_item_id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Output Porsi (Yield Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    value={data.yield_qty}
                    onChange={(e) => setData('yield_qty', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Bahan Baku & Dosis *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus size={13} /> Tambah Bahan
                  </button>
                </div>

                <div className="space-y-2">
                  {data.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={row.item_id}
                        onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Bahan SKU</option>
                        {rawItems.map((r) => (
                          <option key={r.id} value={r.id}>[{r.sku}] {r.name}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="any"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />

                      <select
                        value={row.unit_id}
                        onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)}
                        className="w-28 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Satuan</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.symbol}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Waste %"
                        value={row.waste_percentage}
                        onChange={(e) => handleItemChange(idx, 'waste_percentage', e.target.value)}
                        className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi Memasak / Prep</label>
                <textarea
                  rows={2}
                  value={data.instructions}
                  onChange={(e) => setData('instructions', e.target.value)}
                  placeholder="Langkah persiapan atau catatan khusus..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                  <Save size={14} /> Simpan Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}