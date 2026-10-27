import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

interface Branch {
  id: number;
  code: string;
  name: string;
  type: string;
  phone: string | null;
  is_active: boolean;
}

interface Props {
  branches: { data: Branch[] };
}

export default function BranchesIndex({ branches }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    code: '', name: '', type: 'OUTLET', address: '', phone: '', is_active: true,
  });

  const handleOpenModal = (branch: Branch | null = null) => {
    setEditingBranch(branch);
    if (branch) {
      setData({ code: branch.code, name: branch.name, type: branch.type, address: '', phone: branch.phone || '', is_active: branch.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      put(`/branches/${editingBranch.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/branches', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Daftar Cabang" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daftar Cabang (Entitas Outlets)</h1>
          <p className="text-xs text-slate-500 mt-1">Pengaturan kantor pusat (HQ), Central Kitchen (CK), dan outlet cabang.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Cabang
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Nama Cabang</th>
              <th className="py-3.5 px-4">Tipe Entitas</th>
              <th className="py-3.5 px-4">No. Telepon</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {branches.data.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{b.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{b.type}</span></td>
                <td className="py-3 px-4">{b.phone || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {b.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-1">
                  <button onClick={() => handleOpenModal(b)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                  <button onClick={() => confirm('Hapus cabang?') && router.delete(`/branches/${b.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Input Data Cabang</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode Cabang *</label>
                  <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="CK-PALEMBANG" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipe Entitas *</label>
                  <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                    <option value="HQ">HQ (Headquarter)</option>
                    <option value="CENTRAL_KITCHEN">Central Kitchen</option>
                    <option value="OUTLET">Outlet Penjualan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Cabang *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Central Kitchen Palembang" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">No. Telepon</label>
                <input type="text" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="0711-XXXXXX" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}