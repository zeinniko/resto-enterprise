import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

interface Props {
  costCenters: { data: any[] };
  branches: any[];
}

export default function CostCentersIndex({ costCenters, branches }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    branch_id: '', code: '', name: '', is_active: true,
  });

  const handleOpenModal = (cc: any = null) => {
    setEditingCc(cc);
    if (cc) setData({ branch_id: String(cc.branch_id), code: cc.code, name: cc.name, is_active: cc.is_active });
    else reset();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCc) put(`/cost-centers/${editingCc.id}`, { onSuccess: () => setIsModalOpen(false) });
    else post('/cost-centers', { onSuccess: () => setIsModalOpen(false) });
  };

  return (
    <DashboardLayout>
      <Head title="Cost Center" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cost Center & Divisi</h1>
          <p className="text-xs text-slate-500 mt-1">Pusat alokasi biaya per divisi atau departemen operasional.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"><Plus size={16} className="inline mr-1" /> Tambah Cost Center</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">Kode CC</th><th className="py-3.5 px-4">Nama Divisi / Cost Center</th><th className="py-3.5 px-4">Cabang</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {costCenters.data.map((cc) => (
              <tr key={cc.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{cc.code}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{cc.name}</td>
                <td className="py-3 px-4">{cc.branch?.name}</td>
                <td className="py-3 px-4 text-right space-x-1">
                  <button onClick={() => handleOpenModal(cc)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                  <button onClick={() => confirm('Hapus Cost Center?') && router.delete(`/cost-centers/${cc.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Input Cost Center</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Cabang *</label><select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg"><option value="">Pilih Cabang</option>{branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}</select></div>
              <div><label className="block text-xs font-semibold mb-1">Kode Cost Center *</label><input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="CC-KITCHEN" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" /></div>
              <div><label className="block text-xs font-semibold mb-1">Nama Cost Center *</label><input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Kitchen Operations" className="w-full px-3 py-2 text-xs border rounded-lg" /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}