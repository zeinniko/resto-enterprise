import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X, DollarSign } from 'lucide-react';

export default function PayrollsIndex({ payrolls, employees }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    employee_id: '', period: new Date().toISOString().substring(0, 7), net_salary: 0, status: 'PAID',
  });

  const handleEmployeeChange = (empId: string) => {
    const selected = employees.find((e: any) => String(e.id) === empId);
    setData((prev) => ({
      ...prev,
      employee_id: empId,
      net_salary: selected ? selected.basic_salary : 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/payrolls', { onSuccess: () => { setIsModalOpen(false); reset(); } });
  };

  return (
    <DashboardLayout>
      <Head title="Penggajian (Payroll)" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Penggajian Karyawan (Payroll)</h1>
          <p className="text-xs text-slate-500 mt-1">Rekap gajian bulanan, kompensasi, dan penerbitan slip gaji.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <Plus size={16} className="inline mr-1" /> Proses Payroll
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Periode</th>
              <th className="py-3.5 px-4">Karyawan</th>
              <th className="py-3.5 px-4">Gaji Bersih (THP)</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {payrolls?.data?.length > 0 ? (
              payrolls.data.map((pr: any) => (
                <tr key={pr.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{pr.period}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{pr.employee?.name} ({pr.employee?.nik})</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    Rp {Number(pr.net_salary).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pr.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {pr.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada rekap penggajian.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Proses Slip Gaji</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Karyawan *</label>
                <select value={data.employee_id} onChange={(e) => handleEmployeeChange(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((emp: any) => <option key={emp.id} value={emp.id}>[{emp.nik}] {emp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Periode *</label>
                  <input type="month" value={data.period} onChange={(e) => setData('period', e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Gaji Bersih / THP (Rp) *</label>
                  <input type="number" value={data.net_salary} onChange={(e) => setData('net_salary', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-xs border rounded-lg font-mono" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Batal</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">Proses Gaji</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}