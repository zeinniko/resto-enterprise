import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, X, Search, Edit3, Trash2, Save, Layers, UserCheck, CheckCircle2,
  Clock, Calculator, Wallet, Eye, RotateCcw, FileText
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface CashAccount { id: number; code: string; name: string; }

interface EmployeeOption {
  id: number;
  name: string;
  employee_code?: string;
  nik?: string;
  basic_salary: number | string;
  branch_id: number;
  branch?: Branch;
}

interface ServiceChargeOption {
  id: number;
  branch_id: number;
  period: string;
  total_amount_allocated: number | string;
  status: string;
}

interface PayrollJournal {
  id: number;
  journal_number: string;
  transaction_date: string;
}

interface PayrollItem {
  id: number;
  employee_id: number;
  branch_id: number;
  service_charge_allocation_id?: number | null;
  period: string;
  basic_salary: number | string;
  overtime_pay: number | string;
  service_charge_bonus: number | string;
  deductions: number | string;
  net_salary: number | string;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paid_at?: string | null;
  employee?: EmployeeOption;
  branch?: Branch;
  service_charge_allocation?: ServiceChargeOption | null;
  journals?: PayrollJournal[];
}

interface Props {
  payrolls?: {
    data: PayrollItem[];
    links?: { url: string | null; label: string; active: boolean }[];
    total: number;
    from?: number | null;
    to?: number | null;
  };
  employees?: EmployeeOption[];
  serviceCharges?: ServiceChargeOption[];
  branches?: Branch[];
  cashAccounts?: CashAccount[];
  summary?: {
    total_net: number;
    total_paid: number;
    total_pending: number;
  };
  filters?: { search?: string; period?: string; branch_id?: string; status?: string };
}

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function PayrollsIndex({
  payrolls = { data: [], total: 0 },
  employees = [],
  serviceCharges = [],
  branches = [],
  cashAccounts = [],
  summary = { total_net: 0, total_paid: 0, total_pending: 0 },
  filters = {},
}: Props) {
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [search, setSearch] = useState(filters.search || '');
  const [filterPeriod, setFilterPeriod] = useState(filters.period || '');
  const [filterBranch, setFilterBranch] = useState(filters.branch_id || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
  const [viewingPayroll, setViewingPayroll] = useState<PayrollItem | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    employee_id: '' as string | number,
    period: currentPeriod,
    service_charge_allocation_id: '' as string | number,
    basic_salary: 0,
    overtime_pay: 0,
    service_charge_bonus: 0,
    deductions: 0,
    status: 'PAID' as PayrollItem['status'],
    cash_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
  });

  const applyFilters = (overrides?: Partial<NonNullable<Props['filters']>>) => {
    router.get(
      '/payrolls',
      {
        search: overrides?.search ?? search,
        period: overrides?.period ?? filterPeriod,
        branch_id: overrides?.branch_id ?? filterBranch,
        status: overrides?.status ?? filterStatus,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setFilterPeriod('');
    setFilterBranch('');
    setFilterStatus('');
    router.get('/payrolls', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || filterPeriod || filterBranch || filterStatus);

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(data.employee_id)) || null,
    [employees, data.employee_id]
  );

  // Filter pool service charge agar relevan dengan cabang karyawan yang dipilih
  const relevantServiceCharges = useMemo(() => {
    if (!selectedEmployee) return serviceCharges;
    const matched = serviceCharges.filter((sc) => sc.branch_id === selectedEmployee.branch_id);
    return matched.length > 0 ? matched : serviceCharges;
  }, [serviceCharges, selectedEmployee]);

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
        cash_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
      });
    } else {
      reset();
      setData({
        employee_id: '',
        period: filterPeriod || currentPeriod,
        service_charge_allocation_id: '',
        basic_salary: 0,
        overtime_pay: 0,
        service_charge_bonus: 0,
        deductions: 0,
        status: 'PAID',
        cash_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
      });
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
  const paginationLinks = payrolls?.links ?? [];

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Penggajian Karyawan & Slip Gaji (Payroll)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi Take-Home-Pay (THP), kompensasi lembur, alokasi service charge, dan potongan absensi.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus size={16} /> Proses Slip Gaji
        </button>
      </div>

      {/* Ringkasan KPI Payroll */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Beban Gaji (THP)</div>
            <div className="text-lg font-mono font-bold text-slate-900 mt-1">
              {formatRupiah(summary.total_net)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Sudah Dibayarkan (PAID)</div>
            <div className="text-lg font-mono font-bold text-emerald-600 mt-1">
              {formatRupiah(summary.total_paid)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Menunggu Pembayaran</div>
            <div className="text-lg font-mono font-bold text-amber-600 mt-1">
              {formatRupiah(summary.total_pending)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative w-full lg:w-80"
        >
          <input
            type="text"
            placeholder="Cari nama karyawan atau NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {branches.length > 0 && (
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                applyFilters({ branch_id: e.target.value });
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
            >
              <option value="">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.code}] {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PAID">PAID</option>
          </select>

          <input
            type="month"
            value={filterPeriod}
            onChange={(e) => {
              setFilterPeriod(e.target.value);
              applyFilters({ period: e.target.value });
            }}
            className="w-40 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[11px]">
                <th className="py-3.5 px-4">Periode</th>
                <th className="py-3.5 px-4">Karyawan & Cabang</th>
                <th className="py-3.5 px-4 text-right font-mono">Gaji Pokok</th>
                <th className="py-3.5 px-4 text-right font-mono">Lembur + SC</th>
                <th className="py-3.5 px-4 text-right font-mono">Potongan</th>
                <th className="py-3.5 px-4 text-right font-mono">Gaji Bersih (THP)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
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
                        {pr.branch?.name ? ` • ${pr.branch.name}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatRupiah(pr.basic_salary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">
                      +{formatRupiah(Number(pr.overtime_pay) + Number(pr.service_charge_bonus))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      -{formatRupiah(pr.deductions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatRupiah(pr.net_salary)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(pr.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setViewingPayroll(pr)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                        title="Lihat Rincian Slip Gaji"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(pr)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      {pr.status !== 'PAID' && (
                        <button
                          onClick={() => handleDelete(pr)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                    Belum ada data penggajian terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginationLinks.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{payrolls.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{payrolls.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{payrolls.total}</span> slip gaji
            </div>
            <div className="flex flex-wrap gap-1">
              {paginationLinks.map((link, idx) => (
                <button
                  key={idx}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                    link.active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : link.url
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Input / Edit Slip Gaji */}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
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
                      {emp.branch?.name ? ` (${emp.branch.name})` : ''}
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
                    <option value="">Tanpa Pool SC</option>
                    {relevantServiceCharges.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        Pool {sc.period} ({formatRupiah(sc.total_amount_allocated)})
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
                    min="0"
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
                    min="0"
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
                    min="0"
                    value={data.service_charge_bonus}
                    onChange={(e) => setData('service_charge_bonus', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Potongan / Deductions (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={data.deductions}
                    onChange={(e) => setData('deductions', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.deductions && <p className="text-[10px] text-rose-600 mt-1">{errors.deductions}</p>}
                </div>
              </div>

              {/* Live Preview THP Calculation Box */}
              <div
                className={`p-3 border rounded-lg flex items-center justify-between ${
                  calculatedTHP < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Calculator size={16} className={calculatedTHP < 0 ? 'text-rose-600' : 'text-emerald-600'} />
                  <span>Kalkulasi Gaji Bersih (THP):</span>
                </div>
                <span className={`font-mono font-bold text-base ${calculatedTHP < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {formatRupiah(calculatedTHP)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {data.status === 'PAID' && cashAccounts.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Kas/Bank (Jurnal)</label>
                    <select
                      value={data.cash_account_id}
                      onChange={(e) => setData('cash_account_id', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Otomatis Akun Kas/Bank</option>
                      {cashAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          [{acc.code}] {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  disabled={processing || calculatedTHP < 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  <Save size={14} /> Simpan Slip Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rincian Slip Gaji */}
      {viewingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Rincian Slip Gaji — {viewingPayroll.period}</h2>
              </div>
              <button onClick={() => setViewingPayroll(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{viewingPayroll.employee?.name}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {viewingPayroll.employee?.employee_code || viewingPayroll.employee?.nik || '-'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{viewingPayroll.branch?.name}</div>
                </div>
                {getStatusBadge(viewingPayroll.status)}
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between text-slate-700">
                  <span>Gaji Pokok</span>
                  <span className="font-mono font-semibold">{formatRupiah(viewingPayroll.basic_salary)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Upah Lembur</span>
                  <span className="font-mono">+{formatRupiah(viewingPayroll.overtime_pay)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Bonus Service Charge</span>
                  <span className="font-mono">+{formatRupiah(viewingPayroll.service_charge_bonus)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Potongan / Deductions</span>
                  <span className="font-mono">-{formatRupiah(viewingPayroll.deductions)}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>Take-Home-Pay (THP)</span>
                  <span className="font-mono text-emerald-700">{formatRupiah(viewingPayroll.net_salary)}</span>
                </div>
              </div>

              {viewingPayroll.journals && viewingPayroll.journals.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg px-3.5 py-2.5 text-[11px] text-indigo-900">
                  Jurnal Akuntansi Terposting:{' '}
                  <span className="font-mono font-bold">{viewingPayroll.journals[0].journal_number}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewingPayroll(null)}
                className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}