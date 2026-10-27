import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, ArrowRightLeft, Layers 
} from 'lucide-react';

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

interface UnitConversion {
  id: number;
  from_unit_id: number;
  to_unit_id: number;
  conversion_factor: number;
  from_unit?: Unit;
  to_unit?: Unit;
}

interface Props {
  units: {
    data: Unit[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  allUnits: Unit[];
  conversions: UnitConversion[];
  filters: { search?: string };
}

export default function UnitsIndex({ units, allUnits, conversions, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Form Unit
  const unitForm = useForm({
    name: '',
    symbol: '',
  });

  // Form Conversion
  const conversionForm = useForm({
    from_unit_id: '',
    to_unit_id: '',
    conversion_factor: '',
  });

  const handleOpenUnitModal = (unit: Unit | null = null) => {
    setEditingUnit(unit);
    if (unit) {
      unitForm.setData({ name: unit.name, symbol: unit.symbol });
    } else {
      unitForm.reset();
    }
    unitForm.clearErrors();
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit) {
      unitForm.put(`/units/${editingUnit.id}`, {
        onSuccess: () => {
          setIsUnitModalOpen(false);
          unitForm.reset();
        },
      });
    } else {
      unitForm.post('/units', {
        onSuccess: () => {
          setIsUnitModalOpen(false);
          unitForm.reset();
        },
      });
    }
  };

  const handleConversionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    conversionForm.post('/unit-conversions', {
      onSuccess: () => {
        setIsConversionModalOpen(false);
        conversionForm.reset();
      },
    });
  };

  const handleDeleteUnit = (unit: Unit) => {
    if (confirm(`Hapus satuan "${unit.name}"?`)) {
      router.delete(`/units/${unit.id}`);
    }
  };

  const handleDeleteConversion = (convId: number) => {
    if (confirm('Hapus aturan konversi ini?')) {
      router.delete(`/unit-conversions/${convId}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Satuan & Konversi Unit" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Satuan & Konversi Unit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola unit pengukuran stok dan rumus konversi antar satuan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsConversionModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
          >
            <ArrowRightLeft size={15} />
            Tambah Konversi
          </button>
          <button
            onClick={() => handleOpenUnitModal(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={16} />
            Tambah Satuan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Master Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Daftar Satuan Utama</h2>
            <form onSubmit={(e) => { e.preventDefault(); router.get('/units', { search }, { preserveState: true }); }} className="relative w-60">
              <input
                type="text"
                placeholder="Cari satuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Satuan</th>
                  <th className="py-3 px-4">Simbol</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {units.data.length > 0 ? (
                  units.data.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{u.symbol}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenUnitModal(u)} className="p-1 text-slate-400 hover:text-indigo-600">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDeleteUnit(u)} className="p-1 text-slate-400 hover:text-rose-600">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">Belum ada data satuan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversions Side Table */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Aturan Konversi Active</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            {conversions.length > 0 ? (
              conversions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">1 {c.from_unit?.symbol}</span>
                    <span className="mx-1 text-slate-400">=</span>
                    <span className="font-mono font-bold text-indigo-600">{c.conversion_factor}</span>
                    <span className="ml-1 text-slate-700 font-medium">{c.to_unit?.symbol}</span>
                  </div>
                  <button onClick={() => handleDeleteConversion(c.id)} className="text-slate-400 hover:text-rose-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada aturan konversi.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal CRUD Satuan */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingUnit ? 'Edit Satuan' : 'Tambah Satuan Baru'}
              </h2>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Satuan *</label>
                <input
                  type="text"
                  value={unitForm.data.name}
                  onChange={(e) => unitForm.setData('name', e.target.value)}
                  placeholder="misal: Kilogram"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Simbol *</label>
                <input
                  type="text"
                  value={unitForm.data.symbol}
                  onChange={(e) => unitForm.setData('symbol', e.target.value)}
                  placeholder="misal: Kg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={unitForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CRUD Konversi */}
      {isConversionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Tambah Aturan Konversi</h2>
              <button onClick={() => setIsConversionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConversionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Satuan (1 Unit) *</label>
                  <select
                    value={conversionForm.data.from_unit_id}
                    onChange={(e) => conversionForm.setData('from_unit_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Satuan</option>
                    {allUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ke Satuan Target *</label>
                  <select
                    value={conversionForm.data.to_unit_id}
                    onChange={(e) => conversionForm.setData('to_unit_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Satuan</option>
                    {allUnits.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faktor Pengali Konversi *</label>
                <input
                  type="number"
                  step="any"
                  value={conversionForm.data.conversion_factor}
                  onChange={(e) => conversionForm.setData('conversion_factor', e.target.value)}
                  placeholder="misal: 1000 (1 Kg = 1000 Gram)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsConversionModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={conversionForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Konversi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}