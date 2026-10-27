import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Printer, Edit3, Trash2, X, Save } from 'lucide-react';

interface Props {
  stations: { data: any[]; total: number };
  branches: any[];
  filters: { search?: string };
}

export default function StationsIndex({ stations, branches, filters }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    branch_id: '',
    name: '',
    printer_ip: '',
    is_active: true,
  });

  const handleOpenModal = (station: any = null) => {
    setEditingStation(station);
    if (station) {
      setData({ branch_id: String(station.branch_id), name: station.name, printer_ip: station.printer_ip || '', is_active: station.is_active });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStation) {
      put(`/stations/${editingStation.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/stations', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <Head title="Station Dapur" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Station Dapur & Thermal Printer</h1>
          <p className="text-xs text-slate-500 mt-1">Routing order cetak tiket otomatis per divisi dapur (Bar, Kitchen Hot, Cold Kitchen).</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"><Plus size={16} className="inline mr-1" /> Tambah Station</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase"><th className="py-3.5 px-4">Nama Station Dapur</th><th className="py-3.5 px-4">Cabang</th><th className="py-3.5 px-4">IP Thermal Printer</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y text-slate-700">
            {stations.data.length > 0 ? (
              stations.data.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 font-semibold">{s.branch?.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-600"><Printer size={13} className="inline mr-1 text-slate-400" />{s.printer_ip || 'Tanpa Printer'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{s.is_active ? 'Aktif' : 'Non-Aktif'}</span></td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(s)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                    <button onClick={() => confirm('Hapus station?') && router.delete(`/stations/${s.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))
            ) : (<tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada station dapur terdaftar.</td></tr>)}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-sm font-bold">Setting Station Dapur</h2><button onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang *</label>
                <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Station *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="misal: Kitchen Hot / Bar" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">IP Address Printer LAN (Opsional)</label>
                <input type="text" value={data.printer_ip} onChange={(e) => setData('printer_ip', e.target.value)} placeholder="192.168.1.200" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button><button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}