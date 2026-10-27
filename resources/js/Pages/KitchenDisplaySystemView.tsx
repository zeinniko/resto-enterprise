import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Clock, CheckCircle2, ChefHat, ArrowLeft } from 'lucide-react';

const DUMMY_KITCHEN_ORDERS = [
  {
    id: 1, orderNo: '#ORD-104', table: 'MEJA 04', type: 'Dine-In', timeElapsed: '16 mnt', status: 'URGENT',
    items: [
      { name: '2x Nasi Goreng Special', note: 'Pedas bgt, tanpa timun', done: false },
      { name: '1x Sup Buntut Sapi', note: 'Kuah pisah', done: true },
    ]
  },
  {
    id: 2, orderNo: '#ORD-105', table: 'TAKEAWAY', type: 'Bungkus', timeElapsed: '11 mnt', status: 'WARNING',
    items: [
      { name: '3x Chicken Wings BBQ', note: 'Extra saus sambal', done: false },
      { name: '2x French Fries', note: 'Asin gurih', done: false },
    ]
  },
  {
    id: 3, orderNo: '#ORD-106', table: 'GRABFOOD', type: 'Delivery', timeElapsed: '4 mnt', status: 'NORMAL',
    items: [
      { name: '1x Wagyu Steak Medium', note: 'Mushroom sauce', done: false },
    ]
  }
];

export default function KitchenDisplaySystemView() {
  const [orders, setOrders] = useState(DUMMY_KITCHEN_ORDERS);

  const toggleItemDone = (orderId: number, itemIdx: number) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const newItems = [...order.items];
        newItems[itemIdx].done = !newItems[itemIdx].done;
        return { ...order, items: newItems };
      }
      return order;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-6 font-sans">
      <Head title="Kitchen Display System (KDS)" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-wide">KITCHEN DISPLAY SYSTEM (KDS)</h1>
              <p className="text-xs text-slate-500">Station: <span className="text-indigo-600 font-bold">DAPUR UTAMA & GRILL</span></p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-xs font-mono font-bold">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">URGENT: 1</span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">MENUNGGU: 2</span>
        </div>
      </div>

      {/* Grid Order Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orders.map(order => (
          <div 
            key={order.id}
            className={`bg-white rounded-2xl border flex flex-col overflow-hidden shadow-sm ${
              order.status === 'URGENT' ? 'border-rose-300 ring-2 ring-rose-100' : 
              order.status === 'WARNING' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
            }`}
          >
            <div className={`p-4 flex justify-between items-center font-bold text-xs ${
              order.status === 'URGENT' ? 'bg-rose-500 text-white' : 
              order.status === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
            }`}>
              <div>
                <span className="font-mono text-sm block">{order.orderNo}</span>
                <span className="text-[11px] opacity-90">{order.table} ({order.type})</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs px-2.5 py-1 bg-black/20 rounded-lg">
                <Clock size={13} /> {order.timeElapsed}
              </div>
            </div>

            <div className="p-4 flex-1 space-y-3">
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleItemDone(order.id, idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    item.done ? 'bg-slate-50 border-slate-200 opacity-50 line-through' : 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-800">{item.name}</p>
                  {item.note && <p className="text-[11px] text-rose-600 font-semibold mt-1">⚠️ {item.note}</p>}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> SAJIKAN SELESAI
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}