import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Plus, Flame, ArrowLeft, ShoppingBag, QrCode } from 'lucide-react';

const QR_ITEMS = [
  { id: 201, name: 'Nasi Goreng Special Meja', desc: 'Pedas sedang dengan telur ceplok dan kerupuk', price: 35000, isPopular: true },
  { id: 202, name: 'Ayam Bakar Madu', desc: 'Ayam bakar saus madu gurih manis', price: 42000, isPopular: false },
  { id: 203, name: 'Es Teh Manis Jumbo', desc: 'Teh manis dingin ukuran jumbo 500ml', price: 10000, isPopular: true },
  { id: 204, name: 'Kopi Susu Gula Aren', desc: 'Espresso arabika dengan gula aren murni', price: 22000, isPopular: false },
];

export default function SelfOrderingQRView() {
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(45000);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans shadow-2xl relative border-x border-slate-200">
      <Head title="Pemesanan Mandiri - QR Meja" />

      {/* Header Mobile QR */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <Link href="/dashboard" className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold flex items-center gap-1">
            <QrCode size={13} /> MEJA 08 - AREA INDOOR
          </span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Gourmet Resto QR Order</h1>
        <p className="text-xs text-indigo-100 mt-1">Pesan langsung dari smartphone tanpa antre.</p>
      </div>

      {/* Item List */}
      <div className="flex-1 p-4 space-y-4 pb-24">
        {QR_ITEMS.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex gap-4 items-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div className="flex-1 min-w-0">
              {item.isPopular && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mb-1">
                  <Flame size={12} /> REKOMENDASI
                </span>
              )}
              <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-indigo-600">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
                <button 
                  onClick={() => {
                    setCartCount(cartCount + 1);
                    setCartTotal(cartTotal + item.price);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Plus size={14} /> Pesan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Order Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/90 backdrop-blur-md border-t border-slate-200">
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg shadow-indigo-600/30">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-mono text-xs">{cartCount}</span>
            <span>Lihat Pesanan Meja</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">Rp {cartTotal.toLocaleString('id-ID')}</span>
            <ChevronRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
}