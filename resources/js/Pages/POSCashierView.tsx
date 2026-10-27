import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
  ShoppingCart, Search, CreditCard, Banknote, QrCode, 
  Trash2, Plus, Minus, ArrowLeft
} from 'lucide-react';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Nasi Goreng Special', price: 35000, category: 'Makanan Utama', code: 'MKN-01' },
  { id: 2, name: 'Ayam Bakar Madu', price: 42000, category: 'Makanan Utama', code: 'MKN-02' },
  { id: 3, name: 'Es Teh Manis Jumbo', price: 10000, category: 'Minuman', code: 'MNM-01' },
  { id: 4, name: 'Kopi Milk Gula Aren', price: 22000, category: 'Minuman', code: 'MNM-02' },
  { id: 5, name: 'French Fries Cheese', price: 20000, category: 'Cemilan', code: 'CML-01' },
  { id: 6, name: 'Paket Steak Wagyu', price: 85000, category: 'Paket Combo', code: 'PKT-01' },
];

export default function POSCashierView() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<any[]>([
    { id: 1, name: 'Nasi Goreng Special', price: 35000, qty: 2, note: 'Pedas Sedang' },
    { id: 3, name: 'Es Teh Manis Jumbo', price: 10000, qty: 2, note: 'Less Ice' },
  ]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, note: '' }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex overflow-hidden font-sans select-none">
      <Head title="Platform POS Kasir" />

      {/* KIRI: KATALOG MENU */}
      <div className="flex-1 flex flex-col border-r border-slate-200">
        <div className="h-16 px-6 bg-white flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Platform Kasir POS Front-End</h2>
              <p className="text-[11px] text-slate-500">Kasir: Zein Niko • Outlet: <span className="text-indigo-600 font-bold">MEJA-08</span></p>
            </div>
          </div>
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari menu / SKU..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="p-4 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto">
          {['Semua', 'Makanan Utama', 'Minuman', 'Cemilan', 'Paket Combo'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-3">
          {DUMMY_PRODUCTS.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white hover:border-indigo-500 border border-slate-200 rounded-2xl p-4 text-left flex flex-col justify-between transition-all group shadow-sm active:scale-95"
            >
              <div>
                <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase">{product.code}</span>
                <h3 className="font-bold text-sm text-slate-800 mt-1 group-hover:text-indigo-600">{product.name}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-extrabold text-indigo-700 font-mono">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
                <span className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KANAN: RINGKASAN ORDER */}
      <div className="w-96 bg-white flex flex-col border-l border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" /> Ringkasan Pesanan
          </h3>
          <button onClick={() => setCart([])} className="text-slate-400 hover:text-rose-600 p-1">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cart.map(item => (
            <div key={item.id} className="pt-3 first:pt-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                  <p className="text-[10px] text-indigo-600 font-medium italic mt-0.5">{item.note || '+ Catatan'}</p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  Rp {(item.price * item.qty).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-500 font-mono">Rp {item.price.toLocaleString('id-ID')}</span>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                  <button onClick={() => updateQty(item.id, -1)} className="text-slate-500 hover:text-slate-900"><Minus size={12} /></button>
                  <span className="font-mono font-bold text-xs text-slate-800 w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="text-slate-500 hover:text-slate-900"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono text-slate-900 font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span>Pajak Resto (10%)</span><span className="font-mono text-slate-900 font-semibold">Rp {tax.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span>TOTAL</span>
              <span className="font-mono text-indigo-600 text-base">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 gap-1 shadow-sm">
              <Banknote size={16} className="text-emerald-600" /> Tunai
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 gap-1 shadow-sm">
              <QrCode size={16} className="text-indigo-600" /> QRIS
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 gap-1 shadow-sm">
              <CreditCard size={16} className="text-amber-600" /> EDC
            </button>
          </div>

          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs rounded-xl shadow-md shadow-indigo-200 transition-all uppercase tracking-wider">
            Bayar & Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}