import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { UserCheck, Search, Building2, ShieldCheck, Layers } from 'lucide-react';

interface BranchItem {
  id: number;
  name: string;
  code: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  branch_id?: number | null;
  branch_user?: {
    id: number;
    branch_id: number;
    role?: string;
    branch?: BranchItem;
  };
}

interface Props {
  users?: { data: UserItem[]; total: number };
  branches?: BranchItem[];
  filters?: { search?: string };
}

export default function BranchUsersIndex({
  users = { data: [], total: 0 },
  branches = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/branch-users', { search }, { preserveState: true });
  };

  const handleBranchChange = (userId: number, branchId: string) => {
    if (!branchId) return;
    router.put(
      `/branch-users/${userId}`,
      { branch_id: branchId, role: 'STAFF' },
      { preserveState: true }
    );
  };

  const userList = Array.isArray(users?.data) ? users.data : [];

  return (
    <DashboardLayout>
      <Head title="Hak Akses User Cabang" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hak Akses User Cabang</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penugasan akun pengguna/kasir ke lokasi outlet atau Central Kitchen tertentu.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama pengguna atau email..."
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
              <th className="py-3.5 px-4">Pengguna (User)</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Cabang Penugasan Saat Ini</th>
              <th className="py-3.5 px-4">Pilih / Ubah Outlet Cabang</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {userList.length > 0 ? (
              userList.map((u) => {
                const assignedBranchId = u.branch_user?.branch_id || u.branch_id || '';
                const assignedBranchName = u.branch_user?.branch?.name;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck size={15} className="text-indigo-600 shrink-0" />
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      {assignedBranchName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Building2 size={12} />
                          {assignedBranchName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Belum Ditempatkan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={assignedBranchId}
                        onChange={(e) => handleBranchChange(u.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Pilih Cabang Penugasan --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.code}] {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada data pengguna terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}