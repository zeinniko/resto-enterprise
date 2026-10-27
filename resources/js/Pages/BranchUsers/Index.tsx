import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function BranchUsersIndex({ users, branches }: any) {
  const handleBranchChange = (userId: number, branchId: string) => {
    router.put(`/branch-users/${userId}`, { branch_id: branchId, role: 'STAFF' });
  };

  return (
    <DashboardLayout>
      <Head title="Hak Akses User Cabang" />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Hak Akses User Cabang</h1>
        <p className="text-xs text-slate-500 mt-1">Penugasan akun pengguna ke outlet atau Central Kitchen tertentu.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Pengguna</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Cabang Penugasan</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {users?.data?.length > 0 ? (
              users.data.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck size={15} className="text-indigo-600" /> {u.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.branch_id || ''}
                      onChange={(e) => handleBranchChange(u.id, e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="">-- Pilih Cabang --</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400">Belum ada data user.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}