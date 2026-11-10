import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, DollarSign, Search, Edit3, Trash2, Save, Layers, UserCheck, CheckCircle2, Clock, ShieldAlert, Calculator, FileText } from 'lucide-react';

interface EmployeeOption {
  id: number;
  name: string;
  employee_code?: string;
  nik?: string;
  basic_salary: number;
  branch_id: number;
  branch?: { id: number; name: string; code: string };
}

interface ServiceChargeOption {
  id: number;
  branch_id: number;
  period: string;
  total_amount_allocated: number;
  status: string;
}

interface PayrollItem {
  id: number;
  employee_id: number;
  branch_id: number;
  service_charge_allocation_id?: number | null;
  period: string;
  basic_salary: number;
  overtime_pay: number;
  service_charge_bonus: number;
  deductions: number;
  net_salary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paid_at?: string | null;
  employee?: EmployeeOption;
}

interface Props {
  payrolls?: { data: PayrollItem[]; total: number };
  employees?: EmployeeOption[];
  serviceCharges?: ServiceChargeOption[];
  filters?: { search?: string; period?: string };
}

export default function PayrollsIndex({
  payrolls = { data: [], total: 0 },
  employees = [],
  serviceCharges = [],
  filters = {},
}: Props) {
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [search, setSearch] = useState(filters.search || '');
  const [filterPeriod, setFilterPeriod] = useState(filters.period || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    employee_id: '' as string | number,
    period: currentPeriod,
    service_charge_allocation_id: '' as string | number,
    basic_salary: 0,
    overtime_pay: 0,
    service_charge_bonus: 0,
    deductions: 0,
    status: 'PAID' as PayrollItem['status'],
  });

  const handleFilter = (searchVal: string, periodVal: string) => {
    router.get('/payrolls', { search: searchVal, period: periodVal }, { preserveState: true });
  };

  const handleEmployeeChange = (empId: string) => {
    const selected = employees.find((e) => String(e.id) === empId);
    setData((prev) => ({
      ...prev,
      employee_id: empId,
      basic_salary: selected ? Number(selected.basic_salary) : 0,
    }));
  };

  const handleOpenModal = (item: PayrollItem | null = null) => {
    clearErrors();
    setEditingPayroll(item);
    if (item) {
      setData({
        employee_id: item.employee_id,
        period: item.period,
        service_charge_allocation_id: item.service_charge_allocation_id || '',
        basic_salary: Number(item.basic_salary),
        overtime_pay: Number(item.overtime_pay),
        service_charge_bonus: Number(item.service_charge_bonus),
        deductions: Number(item.deductions),
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
    if (editingPayroll) {
      put(`/payrolls/${editingPayroll.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/payrolls', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (item: PayrollItem) => {
    if (confirm(`Hapus slip gaji ${item.employee?.name} periode ${item.period}?`)) {
      router.delete(`/payrolls/${item.id}`);
    }
  };

  const calculatedTHP =
    (Number(data.basic_salary) || 0) +
    (Number(data.overtime_pay) || 0) +
    (Number(data.service_charge_bonus) || 0) -
    (Number(data.deductions) || 0);

  const payrollList = Array.isArray(payrolls?.data) ? payrolls.data : [];

  const getStatusBadge = (status: PayrollItem['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> PAID (Lunas)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Disetujui
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} /> DRAFT
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <Head title="Penggajian (Payroll)" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Penggajian Karyawan & Slip Gaji (Payroll)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitukasi Take-Home-Pay (THP), kompensasi lembur, alokasi service charge, dan potongan absensi.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Proses Slip Gaji
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); handleFilter(search, filterPeriod); }} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama karyawan atau NIK..."
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
              <th className="py-3.5 px-4">Periode</th>
              <th className="py-3.5 px-4">Karyawan</th>
              <th className="py-3.5 px-4 font-mono">Gaji Pokok</th>
              <th className="py-3.5 px-4 font-mono">Lembur + SC</th>
              <th className="py-3.5 px-4 font-mono">Potongan</th>
              <th className="py-3.5 px-4 font-mono">Gaji Bersih (THP)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {payrollList.length > 0 ? (
              payrollList.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{pr.period}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck size={14} className="text-slate-400 shrink-0" />
                      <span>{pr.employee?.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {pr.employee?.employee_code || pr.employee?.nik || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    Rp {Number(pr.basic_salary).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600">
                    +Rp {(Number(pr.overtime_pay) + Number(pr.service_charge_bonus)).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-mono text-rose-600">
                    -Rp {Number(pr.deductions).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                    Rp {Number(pr.net_salary).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(pr.status)}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(pr)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(pr)}
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
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada data penggajian terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingPayroll ? 'Edit Slip Gaji Karyawan' : 'Input / Proses Slip Gaji Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Karyawan *</label>
                <select
                  value={data.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Pilih Karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      [{emp.employee_code || emp.nik}] {emp.name}
                    </option>
                  ))}
                </select>
                {errors.employee_id && <p className="text-[10px] text-rose-600 mt-1">{errors.employee_id}</p>}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alokasi Service Charge</label>
                  <select
                    value={data.service_charge_allocation_id}
                    onChange={(e) => setData('service_charge_allocation_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">- Tanpa Pool SC -</option>
                    {serviceCharges.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        Pool {sc.period} (Rp {Number(sc.total_amount_allocated).toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gaji Pokok (Rp) *</label>
                  <input
                    type="number"
                    value={data.basic_salary}
                    onChange={(e) => setData('basic_salary', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.basic_salary && <p className="text-[10px] text-rose-600 mt-1">{errors.basic_salary}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Upah Lembur (Rp)</label>
                  <input
                    type="number"
                    value={data.overtime_pay}
                    onChange={(e) => setData('overtime_pay', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus Service Charge (Rp)</label>
                  <input
                    type="number"
                    value={data.service_charge_bonus}
                    onChange={(e) => setData('service_charge_bonus', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Potongan / Deductions (Rp)</label>
                  <input
                    type="number"
                    value={data.deductions}
                    onChange={(e) => setData('deductions', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview THP Calculation Box */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 font-medium text-xs">
                  <Calculator size={16} className="text-emerald-600" />
                  <span>Kalkulasi Gaji Bersih (THP):</span>
                </div>
                <span className="font-mono font-bold text-base text-emerald-700">
                  Rp {calculatedTHP.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Penggajian *</label>
                <select
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value as PayrollItem['status'])}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT (Dalam Peninjauan)</option>
                  <option value="APPROVED">APPROVED (Disetujui Management)</option>
                  <option value="PAID">PAID (Sudah Ditransfer / Lunas)</option>
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
                  <Save size={14} /> Simpan Slip Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}