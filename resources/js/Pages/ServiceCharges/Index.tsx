import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, Coins, Edit3, Trash2, Search, Save, Layers, Building2, CheckCircle2, Clock } from 'lucide-react';

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ServiceChargeItem {
  id: number;
  branch_id: number;
  period: string;
  total_collected: number;
  allocated_percentage: number;
  total_amount_allocated: number;
  status: 'DRAFT' | 'DISTRIBUTED';
  branch?: BranchOption;
}

interface Props {
  records?: { data: ServiceChargeItem[]; total: number };
  branches?: BranchOption[];
  filters?: { search?: string; period?: string };
}

export default function ServiceChargesIndex({
  records = { data: [], total: 0 },
  branches = [],
  filters = {},
}: Props) {
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [search, setSearch] = useState(filters.search || '');
  const [filterPeriod, setFilterPeriod] = useState(filters.period || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceChargeItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '' as string | number,
    period: currentPeriod,
    total_collected: 0,
    allocated_percentage: 100,
    status: 'DRAFT' as ServiceChargeItem['status'],
  });

  const handleFilter = (searchVal: string, periodVal: string) => {
    router.get('/service-charges', { search: searchVal, period: periodVal }, { preserveState: true });
  };

  const handleOpenModal = (item: ServiceChargeItem | null = null) => {
    clearErrors();
    setEditingRecord(item);
    if (item) {
      setData({
        branch_id: item.branch_id,
        period: item.period,
        total_collected: Number(item.total_collected),
        allocated_percentage: Number(item.allocated_percentage),
        status: item.status,
      });
    } else {
      reset();
      setData('period', currentPeriod);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      put(`/service-charges/${editingRecord.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/service-charges', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (item: ServiceChargeItem) => {
    if (confirm(`Hapus alokasi service charge periode ${item.period} (${item.branch?.name})?`)) {
      router.delete(`/service-charges/${item.id}`);
    }
  };

  const calculatedAllocation = (Number(data.total_collected) * Number(data.allocated_percentage)) / 100;
  const recordList = Array.isArray(records?.data) ? records.data : [];

  return (
    <DashboardLayout>
      <Head title="Alokasi Service Charge" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alokasi Service Charge Resto</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan & akumulasi pool service charge bulanan untuk didistribusikan ke komponen gaji staf.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Alokasikan Service Charge
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); handleFilter(search, filterPeriod); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari cabang atau periode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={filterPeriod}
            onChange={(e) => { setFilterPeriod(e.target.value); handleFilter(search, e.target.value); }}
            className="w-full sm:w-44 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          {filterPeriod && (
            <button
              onClick={() => { setFilterPeriod(''); handleFilter(search, ''); }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Periode Bulan</th>
              <th className="py-3.5 px-4">Cabang Restaurant</th>
              <th className="py-3.5 px-4 text-right">Total Terkumpul (Rp)</th>
              <th className="py-3.5 px-4 text-center">Persentase (%)</th>
              <th className="py-3.5 px-4 text-right">Total Alokasi Staf (Rp)</th>
              <th className="py-3.5 px-4">Status Alokasi</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {recordList.length > 0 ? (
              recordList.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sc.period}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span>[{sc.branch?.code}] {sc.branch?.name}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    Rp {Number(sc.total_collected).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                    {Number(sc.allocated_percentage)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    Rp {Number(sc.total_amount_allocated).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    {sc.status === 'DISTRIBUTED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Distributed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={11} /> Draft Pool
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(sc)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(sc)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada alokasi service charge terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingRecord ? 'Edit Service Charge Pool' : 'Input Service Charge Pool Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Resto *</label>
                <select
                  value={data.branch_id}
                  onChange={(e) => setData('branch_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && <p className="text-[10px] text-rose-600 mt-1">{errors.branch_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode (YYYY-MM) *</label>
                  <input
                    type="month"
                    value={data.period}
                    onChange={(e) => setData('period', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.period && <p className="text-[10px] text-rose-600 mt-1">{errors.period}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Persentase Alokasi (%) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={data.allocated_percentage}
                    onChange={(e) => setData('allocated_percentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.allocated_percentage && <p className="text-[10px] text-rose-600 mt-1">{errors.allocated_percentage}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Pool Service Charge Terkumpul (Rp) *</label>
                <input
                  type="number"
                  value={data.total_collected}
                  onChange={(e) => setData('total_collected', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.total_collected && <p className="text-[10px] text-rose-600 mt-1">{errors.total_collected}</p>}
              </div>

              {/* Live Preview Calculation Box */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-medium text-xs">
                  <Coins size={16} className="text-indigo-600" />
                  <span>Est. Total Alokasi Staf:</span>
                </div>
                <span className="font-mono font-bold text-sm text-indigo-700">
                  Rp {calculatedAllocation.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Alokasi *</label>
                <select
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value as ServiceChargeItem['status'])}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT (Dalam Pengumpulan)</option>
                  <option value="DISTRIBUTED">DISTRIBUTED (Siap Bagikan ke Payroll)</option>
                </select>
                {errors.status && <p className="text-[10px] text-rose-600 mt-1">{errors.status}</p>}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm"
                >
                  <Save size={14} /> Simpan Alokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}