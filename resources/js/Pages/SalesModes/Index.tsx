import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

interface Props { salesModes: { data: any[] } }

export default function SalesModesIndex({ salesModes }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    code: '', name: '', markup_percentage: 0, is_active: true,
  });

  const handleOpenModal = (mode: any = null) => {
    setEditingMode(mode);
    if (mode) setData({ code: mode.code, name: mode.name, markup_percentage: mode.markup_percentage, is_active: mode.is_active });
    else reset();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMode) put(`/sales-modes/${editingMode.id}`, { onSuccess: () => setIsModalOpen(false) });
    else post('/sales-modes', { onSuccess: () => setIsModalOpen(false) });
  };

  return (
    <DashboardLayout>
      <Head title="Mode Penjualan (Sales Modes)" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mode Penjualan (Sales Modes)</h1>
          <p className="text-xs text-slate-500 mt-1">Kanal penjualan POS (Dine-In, Takeaway, GoFood, GrabFood) beserta persentase harga markup.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"><Plus size={16} className="inline mr-1" /> Tambah Sales Mode</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">Kode</th><th className="py-3.5 px-4">Nama Mode</th><th className="py-3.5 px-4">Markup Harga (%)</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {salesModes.data.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{m.code}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                <td className="py-3 px-4 font-mono font-bold text-amber-700">+{m.markup_percentage}%</td>
                <td className="py-3 px-4 text-right space-x-1">
                  <button onClick={() => handleOpenModal(m)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                  <button onClick={() => confirm('Hapus sales mode?') && router.delete(`/sales-modes/${m.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Input Sales Mode</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Kode *</label><input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="DINE_IN / GOFOOD" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" /></div>
              <div><label className="block text-xs font-semibold mb-1">Nama Sales Mode *</label><input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Dine-In Restaurant" className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              <div><label className="block text-xs font-semibold mb-1">Persentase Markup Harga (%)</label><input type="number" step="any" value={data.markup_percentage} onChange={(e) => setData('markup_percentage', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}