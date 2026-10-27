import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Flame, CheckCircle, ArrowLeft } from 'lucide-react';

export default function QueueDisplayView() {
  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      <Head title="Monitor Antrean Queue Display" />

      {/* Header Banner */}
      <div className="h-20 bg-white px-8 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-wider">RESTO DISPLAY ANTREAN</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Order Pick-Up Status</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xl font-bold text-indigo-600">14:25 WIB</span>
        </div>
      </div>

      {/* Grid Monitor */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-slate-200">
        {/* SEDANG DISIAPKAN */}
        <div className="p-8 bg-slate-50 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="text-amber-500 animate-pulse" size={26} />
            <h2 className="text-lg font-black text-amber-600 tracking-wider uppercase">Sedang Disiapkan</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['#A-104', '#A-105', '#B-201', '#A-107'].map(num => (
              <div key={num} className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                <span className="font-mono font-black text-4xl text-slate-700 tracking-widest">{num}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIAP DIAMBIL */}
        <div className="p-8 bg-emerald-50/50 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-emerald-600" size={26} />
            <h2 className="text-lg font-black text-emerald-700 tracking-wider uppercase">Siap Diambil</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['#A-101', '#A-102', '#A-103'].map((num, idx) => (
              <div 
                key={num} 
                className={`rounded-2xl p-6 text-center shadow-md border flex flex-col items-center justify-center ${
                  idx === 0 ? 'bg-emerald-600 border-emerald-500 text-white animate-bounce' : 'bg-white border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="font-mono font-black text-5xl tracking-widest">{num}</span>
                <span className={`text-xs font-bold uppercase tracking-wider mt-2 px-3 py-1 rounded-full ${
                  idx === 0 ? 'bg-black/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Counter 01
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}