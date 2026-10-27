import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { HardHat, RefreshCw, Sparkles } from 'lucide-react';
import { Head } from '@inertiajs/react';

interface Props {
  pageTitle: string;
}

export default function Maintenance({ pageTitle }: Props) {
  return (
    <DashboardLayout>
      <Head title={pageTitle} />
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-lg mx-auto">
        {/* Decorative Graphic */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
            <HardHat size={40} className="animate-bounce" />
          </div>
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-500">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm mb-3">
          <RefreshCw size={12} className="animate-spin text-indigo-600" />
          Tahap Pengembangan Frontend
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {pageTitle}
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Skema database dan Eloquent Model Laravel untuk modul ini sudah siap 100%. Antarmuka dashboard React sedang disiapkan.
        </p>

        {/* Action Button */}
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-md shadow-indigo-200"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </DashboardLayout>
  );
}