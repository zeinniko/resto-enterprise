import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, LayoutGrid, Users, X, Save } from 'lucide-react';

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

interface Floor {
  id: number;
  name: string;
  branch?: { name: string };
  tables?: Table[];
}

interface Props {
  floors: { data: Floor[]; total: number };
  branches: { id: number; name: string; code: string }[];
}

export default function FloorsTablesIndex({ floors, branches }: Props) {
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  const floorForm = useForm({ branch_id: '', name: '', is_active: true });
  const tableForm = useForm({ floor_id: '', table_number: '', capacity: 4, is_active: true });

  const handleFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    floorForm.post('/floors', { onSuccess: () => { setIsFloorModalOpen(false); floorForm.reset(); } });
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tableForm.post('/tables', { onSuccess: () => { setIsTableModalOpen(false); tableForm.reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Layout Meja & Denah" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Layout Meja & Denah Outlets</h1>
          <p className="text-xs text-slate-500 mt-1">Atur denah area makan dan penomoran meja fisik untuk POS Dine-In.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { floorForm.reset(); setIsFloorModalOpen(true); }} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg">
            + Tambah Area / Lantai
          </button>
          <button onClick={() => { tableForm.reset(); setIsTableModalOpen(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm">
            <Plus size={16} className="inline mr-1" /> Tambah Meja
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {floors.data.length > 0 ? (
          floors.data.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900">{f.name} <span className="text-xs font-normal text-slate-400">({f.branch?.name})</span></h2>
                <span className="text-xs text-slate-500">{f.tables?.length || 0} Meja Terdaftar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {f.tables?.map((t) => (
                  <div key={t.id} className={`p-3 rounded-lg border text-center space-y-1 ${
                    t.status === 'AVAILABLE' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' :
                    t.status === 'OCCUPIED' ? 'bg-rose-50/50 border-rose-200 text-rose-800' :
                    'bg-amber-50/50 border-amber-200 text-amber-800'
                  }`}>
                    <p className="font-bold text-sm">Meja {t.table_number}</p>
                    <p className="text-[10px] flex items-center justify-center gap-1 opacity-80"><Users size={10} /> {t.capacity} Orang</p>
                    <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white shadow-xs">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Belum ada denah area terdaftar.</div>
        )}
      </div>

      {/* Modal Area */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Tambah Area / Lantai</h2><button onClick={() => setIsFloorModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleFloorSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang *</label>
                <select value={floorForm.data.branch_id} onChange={(e) => floorForm.setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Area / Lantai *</label>
                <input type="text" value={floorForm.data.name} onChange={(e) => floorForm.setData('name', e.target.value)} placeholder="misal: Indoor Lantai 1 / VIP Outdoor" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsFloorModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Meja */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Tambah Meja Baru</h2><button onClick={() => setIsTableModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Area / Lantai *</label>
                <select value={tableForm.data.floor_id} onChange={(e) => tableForm.setData('floor_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Area</option>
                  {floors.data.map(f => <option key={f.id} value={f.id}>{f.name} ({f.branch?.name})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">No. Meja *</label>
                  <input type="text" value={tableForm.data.table_number} onChange={(e) => tableForm.setData('table_number', e.target.value)} placeholder="misal: 01A" className="w-full px-3 py-2 text-xs border rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kapasitas (Orang) *</label>
                  <input type="number" min="1" value={tableForm.data.capacity} onChange={(e) => tableForm.setData('capacity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 text-xs border rounded-lg" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsTableModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan Meja</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}