import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, Truck, Phone, Mail, MapPin, Clock 
} from 'lucide-react';

interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lead_time_days: number;
}

interface Props {
  suppliers: {
    data: Supplier[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
  };
  filters: { search?: string };
}

export default function SuppliersIndex({ suppliers, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    lead_time_days: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/suppliers', { search }, { preserveState: true });
  };

  const handleOpenModal = (sup: Supplier | null = null) => {
    setEditingSupplier(sup);
    if (sup) {
      setData({
        code: sup.code,
        name: sup.name,
        contact_person: sup.contact_person || '',
        phone: sup.phone || '',
        email: sup.email || '',
        address: sup.address || '',
        lead_time_days: sup.lead_time_days,
      });
    } else {
      reset();
    }
    clearErrors();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      put(`/suppliers/${editingSupplier.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/suppliers', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (sup: Supplier) => {
    if (confirm(`Apakah Anda yakin ingin menghapus supplier "${sup.name}"?`)) {
      router.delete(`/suppliers/${sup.id}`);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Master Supplier" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Supplier</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar penyedia bahan baku dan estimasi durasi pengiriman (Lead Time).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Tambah Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kode, nama, atau kontak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Supplier</th>
                <th className="py-3.5 px-4">Kontak Person</th>
                <th className="py-3.5 px-4">Telepon / Email</th>
                <th className="py-3.5 px-4">Lead Time</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {suppliers.data.length > 0 ? (
                suppliers.data.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{sup.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sup.name}</td>
                    <td className="py-3 px-4 text-slate-600">{sup.contact_person || '-'}</td>
                    <td className="py-3 px-4 space-y-0.5">
                      {sup.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          <span>{sup.phone}</span>
                        </div>
                      )}
                      {sup.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail size={12} className="text-slate-400" />
                          <span>{sup.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        <Clock size={11} className="text-slate-500" />
                        {sup.lead_time_days} Hari
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(sup)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(sup)} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Truck size={32} className="mx-auto mb-2 opacity-50" />
                    Belum ada data supplier terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Supplier *</label>
                  <input
                    type="text"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value)}
                    placeholder="SUP-001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.code && <p className="text-[10px] text-rose-500 mt-1">{errors.code}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan / Supplier *</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="PT. Sumber Makmur"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={data.contact_person}
                    onChange={(e) => setData('contact_person', e.target.value)}
                    placeholder="Bpk. Andi"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon / WA</label>
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="supplier@mail.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Hari) *</label>
                  <input
                    type="number"
                    min="0"
                    value={data.lead_time_days}
                    onChange={(e) => setData('lead_time_days', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  placeholder="Alamat kantor / gudang supplier..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium">Batal</button>
                <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                  <Save size={14} />
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}