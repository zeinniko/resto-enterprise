import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, Search, Warehouse, CheckCircle2, Trash2 } from 'lucide-react';

interface Props {
  stockCounts?: { data: any[]; total?: number };
  branches?: any[];
  storageLocations?: any[];
  items?: any[];
  units?: any[];
  filters?: { search?: string };
}

export default function StockCountsIndex({ 
  stockCounts = { data: [] }, 
  branches = [], 
  storageLocations = [], 
  items = [], 
  units = [], 
  filters = {} 
}: Props) {
  const [search, setSearch] = useState(filters?.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state sederhana tanpa nested relation dependency
  const { data, setData, post, processing, reset } = useForm({
    branch_id: '',
    storage_location_id: '',
    count_number: `SO-${Date.now().toString().slice(-6)}`,
    count_date: new Date().toISOString().split('T')[0],
    details: [{ item_id: '', physical_qty: 0, unit_id: '', notes: '' }],
  });

  const handleAddItemRow = () => {
    setData('details', [
      ...data.details, 
      { item_id: '', physical_qty: 0, unit_id: '', notes: '' }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (data.details.length === 1) return;
    const updated = data.details.filter((_, i) => i !== index);
    setData('details', updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...data.details];
    updated[index] = { ...updated[index], [field]: value };
    setData('details', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/stock-counts', {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const handleApprove = (id: number) => {
    if (confirm('Setujui Stock Opname ini?')) {
      router.post(`/stock-counts/${id}/approve`);
    }
  };

  // Safe list data
  const listData = Array.isArray(stockCounts?.data) ? stockCounts.data : [];

  return (
    <DashboardLayout>
      <Head title="Stock Opname" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Opname (Audit Fisik)</h1>
          <p className="text-xs text-slate-500 mt-1">Rekonsiliasi stok fisik dan pencatatan penyesuaian inventaris.</p>
        </div>
        <button 
          onClick={() => { reset(); setIsModalOpen(true); }} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Buat Sesi Opname
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">No. Opname</th>
              <th className="py-3.5 px-4">Cabang / Lokasi</th>
              <th className="py-3.5 px-4">Tgl Audit</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {listData.length > 0 ? (
              listData.map((so: any, idx: number) => {
                // Pembacaan properti fleksibel (suport flat data atau relation data)
                const countNum = so.count_number || so.code || `SO-${so.id || idx + 1}`;
                const branchName = so.branch_name || so.branch?.name || 'Cabang Utama';
                const locationName = so.location_name || so.storage_location?.name || so.storageLocation?.name || 'Gudang';
                const countDate = so.count_date || so.created_at?.split('T')[0] || '-';
                const status = so.status || 'DRAFT';

                return (
                  <tr key={so.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 flex items-center gap-2">
                      <Warehouse size={14} className="text-slate-400" />
                      {countNum}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {locationName} <span className="text-slate-400 font-normal">({branchName})</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{countDate}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        status === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {status === 'DRAFT' && (
                        <button 
                          onClick={() => handleApprove(so.id)} 
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <CheckCircle2 size={13} /> Setujui & Eksekusi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Belum ada data sesi Stock Opname.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Sesi Stock Opname Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select 
                    value={data.branch_id} 
                    onChange={(e) => setData('branch_id', e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b: any, bIdx: number) => (
                      <option key={b.id || bIdx} value={b.id || bIdx}>
                        {b.name || b.label || `Cabang ${bIdx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan *</label>
                  <select 
                    value={data.storage_location_id} 
                    onChange={(e) => setData('storage_location_id', e.target.value)} 
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Pilih Lokasi</option>
                    {storageLocations.map((s: any, sIdx: number) => (
                      <option key={s.id || sIdx} value={s.id || sIdx}>
                        {s.name || s.label || `Gudang ${sIdx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Hasil Cek Fisik Item *</label>
                  <button 
                    type="button" 
                    onClick={handleAddItemRow} 
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {data.details.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select 
                        value={row.item_id} 
                        onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)} 
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Item SKU</option>
                        {items.map((i: any, iIdx: number) => (
                          <option key={i.id || iIdx} value={i.id || iIdx}>
                            {i.name || i.title || `Item ${iIdx + 1}`}
                          </option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Fisik" 
                        value={row.physical_qty} 
                        onChange={(e) => handleItemChange(idx, 'physical_qty', e.target.value)} 
                        className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono" 
                      />

                      <select 
                        value={row.unit_id} 
                        onChange={(e) => handleItemChange(idx, 'unit_id', e.target.value)} 
                        className="w-24 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Satuan</option>
                        {units.map((u: any, uIdx: number) => (
                          <option key={u.id || uIdx} value={u.id || uIdx}>
                            {u.symbol || u.name || `Pcs`}
                          </option>
                        ))}
                      </select>

                      {data.details.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={processing} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm"
                >
                  Simpan Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}