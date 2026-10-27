import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

interface Props {
  employees: { data: any[] };
  branches: any[];
}

export default function EmployeesIndex({ employees, branches }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const { data, setData, post, put, processing, reset } = useForm({
    branch_id: '', nik: '', name: '', position: '', phone: '', basic_salary: 0, is_active: true,
  });

  const handleOpenModal = (employee: any = null) => {
    setEditingEmployee(employee);
    if (employee) {
      setData({ branch_id: String(employee.branch_id), nik: employee.nik, name: employee.name, position: employee.position, phone: employee.phone || '', basic_salary: employee.basic_salary, is_active: employee.is_active });
    } else {
      reset();
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

  return (
    <DashboardLayout>
      <Head title="Data Karyawan" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Karyawan & SDM</h1>
          <p className="text-xs text-slate-500 mt-1">Master data staff, chef, kasir, dan penugasan cabang.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">NIK</th>
              <th className="py-3.5 px-4">Nama Lengkap</th>
              <th className="py-3.5 px-4">Jabatan</th>
              <th className="py-3.5 px-4">Cabang Penugasan</th>
              <th className="py-3.5 px-4">Gaji Pokok</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {employees.data.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{emp.nik}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{emp.position}</span></td>
                <td className="py-3 px-4">{emp.branch?.name}</td>
                <td className="py-3 px-4 font-mono">Rp {Number(emp.basic_salary).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 text-right space-x-1">
                  <button onClick={() => handleOpenModal(emp)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={15} /></button>
                  <button onClick={() => confirm('Hapus karyawan?') && router.delete(`/employees/${emp.id}`)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
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
              <h2 className="text-sm font-bold text-slate-900">Input Data Karyawan</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang Penugasan *</label>
                <select value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Cabang</option>
                  {branches.map(b => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">NIK Karyawan *</label>
                  <input type="text" value={data.nik} onChange={(e) => setData('nik', e.target.value)} placeholder="EMP-001" className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jabatan *</label>
                  <input type="text" value={data.position} onChange={(e) => setData('position', e.target.value)} placeholder="Head Chef / Kasir" className="w-full px-3 py-2 text-xs border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ahmad Rizky" className="w-full px-3 py-2 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Gaji Pokok (Rp) *</label>
                <input type="number" value={data.basic_salary} onChange={(e) => setData('basic_salary', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
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