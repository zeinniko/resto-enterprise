import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Plus, ArrowLeft, ShoppingCart, Touchpad } from 'lucide-react';

const KIOSK_STAND_ITEMS = [
  { id: 301, name: 'Paket Combo Wagyu Burger', desc: 'Burger Wagyu + Truffle Fries + Softdrink', price: 95000, category: 'Paket Kiosk' },
  { id: 302, name: 'Crispy Chicken Steak Set', desc: 'Chicken Steak + Blackpepper Sauce + Rice', price: 58000, category: 'Makanan Utama' },
  { id: 303, name: 'Ice Cream Sundae Chocolate', desc: 'Dessert es krim cokelat keju', price: 25000, category: 'Dessert' },
  { id: 304, name: 'Matcha Milk Tea Toping Boba', desc: 'Minuman boba matcha jepang', price: 32000, category: 'Minuman' },
];

export default function SelfOrderingKioskView() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(95000);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      <Head title="Self-Ordering Kiosk Touchscreen" />

      {/* Header Layar Kiosk Standee */}
      <div className="h-20 bg-white px-8 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-wide">MESIN KIOSK MANDIRI #01</h1>
            <p className="text-xs text-slate-500">Sentuh layar untuk memilih & pesan menu Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-xs border border-indigo-200">
          <Touchpad size={18} /> MODE SELF-SERVICE KIOSK
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Kategori Kiosk */}
        <div className="w-64 bg-white border-r border-slate-200 p-4 space-y-2">
          {['Semua', 'Paket Kiosk', 'Makanan Utama', 'Dessert', 'Minuman'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Produk Kiosk */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-2 gap-4">
          {KIOSK_STAND_ITEMS.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-500 transition-all">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{item.category}</span>
                <h3 className="font-bold text-base text-slate-900 mt-2">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-mono font-extrabold text-lg text-indigo-600">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
                <button 
                  onClick={() => {
                    setCartCount(cartCount + 1);
                    setCartTotal(cartTotal + item.price);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Bar Kiosk Checkout */}
      <div className="h-20 bg-white px-8 border-t border-slate-200 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total ({cartCount} Item)</p>
            <p className="font-mono text-xl font-extrabold text-indigo-600">Rp {cartTotal.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2">
          <span>LANJUTKAN KE PEMBAYARAN</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}