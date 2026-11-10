import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, Search, Save, Layers, UserCheck, Phone, Building2, Calendar, Mail } from 'lucide-react';

interface EmployeeItem {
  id: number;
  branch_id: number;
  user_id?: number | null;
  employee_code: string;
  nik?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  position: 'MANAGER' | 'HEAD_CHEF' | 'COOK' | 'WAITER' | 'CASHIER' | 'DISHWASHER' | 'BARISTA';
  employment_status: 'PERMANENT' | 'CONTRACT' | 'DAILY_WORKER';
  basic_salary: number;
  hourly_rate?: number;
  joined_date: string;
  is_active: boolean;
  branch?: { id: number; name: string; code: string };
}

interface BranchItem {
  id: number;
  name: string;
  code: string;
}

interface Props {
  employees?: { data: EmployeeItem[]; total: number };
  branches?: BranchItem[];
  filters?: { search?: string };
}

export default function EmployeesIndex({
  employees = { data: [], total: 0 },
  branches = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    branch_id: '' as string | number,
    employee_code: '',
    nik: '',
    name: '',
    phone: '',
    email: '',
    position: 'CASHIER' as EmployeeItem['position'],
    employment_status: 'CONTRACT' as EmployeeItem['employment_status'],
    basic_salary: 0,
    hourly_rate: 0,
    joined_date: today,
    is_active: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/employees', { search }, { preserveState: true });
  };

  const handleOpenModal = (employee: EmployeeItem | null = null) => {
    clearErrors();
    setEditingEmployee(employee);
    if (employee) {
      setData({
        branch_id: employee.branch_id,
        employee_code: employee.employee_code,
        nik: employee.nik || '',
        name: employee.name,
        phone: employee.phone || '',
        email: employee.email || '',
        position: employee.position,
        employment_status: employee.employment_status,
        basic_salary: Number(employee.basic_salary),
        hourly_rate: Number(employee.hourly_rate || 0),
        joined_date: employee.joined_date ? employee.joined_date.substring(0, 10) : today,
        is_active: Boolean(employee.is_active),
      });
    } else {
      reset();
      setData('joined_date', today);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      put(`/employees/${editingEmployee.id}`, { onSuccess: () => setIsModalOpen(false) });
    } else {
      post('/employees', { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (employee: EmployeeItem) => {
    if (confirm(`Hapus karyawan "${employee.name}" (${employee.employee_code})?`)) {
      router.delete(`/employees/${employee.id}`);
    }
  };

  const employeeList = Array.isArray(employees?.data) ? employees.data : [];

  return (
    <DashboardLayout>
      <Head title="Data Karyawan" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Karyawan & SDM Resto</h1>
          <p className="text-xs text-slate-500 mt-1">
            Master data staf, chef, kasir, supervisor, dan penugasan lokasi cabang.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
        >
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari Kode, NIK, nama, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode / NIK</th>
              <th className="py-3.5 px-4">Nama Lengkap</th>
              <th className="py-3.5 px-4">Jabatan (Enum)</th>
              <th className="py-3.5 px-4">Cabang Penugasan</th>
              <th className="py-3.5 px-4">Tgl Gabung</th>
              <th className="py-3.5 px-4">Gaji Pokok</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {employeeList.length > 0 ? (
              employeeList.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    <div>{emp.employee_code}</div>
                    {emp.nik && <div className="text-[10px] text-slate-400 font-normal">NIK: {emp.nik}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck size={14} className="text-slate-400 shrink-0" />
                      <span>{emp.name}</span>
                    </div>
                    {emp.phone && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone size={10} /> {emp.phone}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-[10px] text-slate-700 uppercase">
                      {emp.position}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{emp.employment_status}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span>[{emp.branch?.code}] {emp.branch?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {emp.joined_date ? emp.joined_date.substring(0, 10) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    Rp {Number(emp.basic_salary).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {emp.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenModal(emp)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
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
                  Belum ada data karyawan terdaftar.
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
                {editingEmployee ? 'Edit Data Karyawan' : 'Input Data Karyawan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Penugasan *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Karyawan *</label>
                  <input
                    type="text"
                    value={data.employee_code}
                    onChange={(e) => setData('employee_code', e.target.value.toUpperCase())}
                    placeholder="e.g. EMP-001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.employee_code && <p className="text-[10px] text-rose-600 mt-1">{errors.employee_code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIK (Opsional)</label>
                  <input
                    type="text"
                    value={data.nik}
                    onChange={(e) => setData('nik', e.target.value)}
                    placeholder="167101xxxxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.nik && <p className="text-[10px] text-rose-600 mt-1">{errors.nik}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. Ahmad Rizky Pratama"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan (Position) *</label>
                  <select
                    value={data.position}
                    onChange={(e) => setData('position', e.target.value as EmployeeItem['position'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MANAGER">MANAGER</option>
                    <option value="HEAD_CHEF">HEAD_CHEF</option>
                    <option value="COOK">COOK</option>
                    <option value="WAITER">WAITER</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="DISHWASHER">DISHWASHER</option>
                    <option value="BARISTA">BARISTA</option>
                  </select>
                  {errors.position && <p className="text-[10px] text-rose-600 mt-1">{errors.position}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kepegawaian *</label>
                  <select
                    value={data.employment_status}
                    onChange={(e) => setData('employment_status', e.target.value as EmployeeItem['employment_status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CONTRACT">CONTRACT (Kontrak)</option>
                    <option value="PERMANENT">PERMANENT (Tetap)</option>
                    <option value="DAILY_WORKER">DAILY_WORKER (Harian)</option>
                  </select>
                  {errors.employment_status && <p className="text-[10px] text-rose-600 mt-1">{errors.employment_status}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="081271002001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.phone && <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bergabung *</label>
                  <input
                    type="date"
                    value={data.joined_date}
                    onChange={(e) => setData('joined_date', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.joined_date && <p className="text-[10px] text-rose-600 mt-1">{errors.joined_date}</p>}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif Per Jam (Rp)</label>
                  <input
                    type="number"
                    value={data.hourly_rate}
                    onChange={(e) => setData('hourly_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.hourly_rate && <p className="text-[10px] text-rose-600 mt-1">{errors.hourly_rate}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="emp_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500"
                />
                <label htmlFor="emp_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Karyawan Aktif Bekerja
                </label>
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
                  <Save size={14} /> Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}