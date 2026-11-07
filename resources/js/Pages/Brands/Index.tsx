import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, Award, Image as ImageIcon } from 'lucide-react';

interface Brand {
  id: number;
  code: string;
  name: string;
  logo_path: string | null;
  is_active: boolean;
}

interface Props {
  brands?: { data: Brand[] };
}

export default function BrandsIndex({ brands = { data: [] } }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    code: '',
    name: '',
    logo_path: '',
    is_active: true,
  });

  const handleOpenModal = (brand: Brand | null = null) => {
    clearErrors();
    setEditingBrand(brand);
    if (brand) {
      setData({
        code: brand.code,
        name: brand.name,
        logo_path: brand.logo_path || '',
        is_active: Boolean(brand.is_active),
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      put(`/brands/${editingBrand.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/brands', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (brand: Brand) => {
    if (confirm(`Hapus brand "${brand.name}"?`)) {
      router.delete(`/brands/${brand.id}`);
    }
  };

  const listBrands = Array.isArray(brands?.data) ? brands.data : [];

  return (
    <DashboardLayout>
      <Head title="Master Brand / Merk" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Brand / Merk</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola lini merek usaha kuliner di bawah induk perusahaan.</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Tambah Brand
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Nama Brand</th>
              <th className="py-3.5 px-4">Logo Path / URL</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {listBrands.length > 0 ? (
              listBrands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{b.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Award size={15} className="text-indigo-600" /> {b.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {b.logo_path ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <ImageIcon size={13} className="text-slate-400" /> {b.logo_path}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Tanpa Logo</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      b.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {b.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(b)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Belum ada data brand. Silakan tambah data baru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBrand ? 'Edit Data Brand' : 'Input Data Brand Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Brand *</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  placeholder="BRD-GOURMET"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:ring-1 focus:ring-indigo-500"
                />
                {errors.code && <p className="text-[10px] text-rose-600 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Gourmet Resto & Kitchen"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Path / URL (Opsional)</label>
                <input
                  type="text"
                  value={data.logo_path}
                  onChange={(e) => setData('logo_path', e.target.value)}
                  placeholder="/images/brands/gourmet-logo.png"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brand_is_active"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="brand_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Brand Aktif
                </label>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  {editingBrand ? 'Simpan Perubahan' : 'Simpan Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}