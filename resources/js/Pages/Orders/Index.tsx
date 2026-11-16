import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
  Plus, Search, X, Trash2, Eye, Flame, Utensils, CreditCard, Ban, RotateCcw, AlertCircle
} from 'lucide-react';

interface Branch { id: number; name: string; code: string; }
interface SalesMode { id: number; name: string; code?: string; }
interface Table { id: number; branch_id: number; table_number: string; status: string; }
interface MenuItem { id: number; name: string; sku?: string; selling_price: number | string; }

interface OrderItem {
  id: number;
  menu_item_id: number;
  qty: number;
  unit_price: number | string;
  subtotal: number | string;
  notes?: string | null;
  menu_item?: MenuItem;
}

interface Order {
  id: number;
  order_number: string;
  order_type: 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY_AGGREGATOR';
  status: 'PENDING' | 'IN_KITCHEN' | 'SERVED' | 'PAID' | 'CANCELLED';
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  service_charge_amount: number | string;
  grand_total: number | string;
  created_at: string;
  branch?: Branch;
  table?: Table | null;
  sales_mode?: SalesMode | null;
  user?: { id: number; name: string };
  items?: OrderItem[];
}

interface Props {
  orders: {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
  };
  branches: Branch[];
  salesModes: SalesMode[];
  tables: Table[];
  menuItems: MenuItem[];
  openShiftBranchIds?: number[];
  filters: { search?: string; status?: string; branch_id?: string; order_type?: string };
}

const STATUS_BADGE: Record<Order['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_KITCHEN: 'bg-sky-50 text-sky-700 border-sky-200',
  SERVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ORDER_TYPE_LABEL: Record<Order['order_type'], string> = {
  DINE_IN: 'Dine-In',
  TAKE_AWAY: 'Take Away',
  DELIVERY_AGGREGATOR: 'Delivery / Online',
};

const formatRupiah = (val?: number | string | null) =>
  `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

export default function OrdersIndex({
  orders,
  branches = [],
  salesModes = [],
  tables = [],
  menuItems = [],
  openShiftBranchIds = [],
  filters = {},
}: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || '');
  const [selectedOrderType, setSelectedOrderType] = useState(filters.order_type || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT_CARD' | 'TRANSFER'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const createForm = useForm({
    branch_id: '',
    order_type: 'DINE_IN' as Order['order_type'],
    sales_mode_id: '',
    table_id: '',
    discount_amount: 0,
    apply_tax: true,
    apply_service: true,
    items: [{ menu_item_id: '', qty: 1, unit_price: 0, notes: '' }],
  });

  const applyFilters = (overrides?: Partial<Props['filters']>) => {
    router.get(
      '/orders',
      {
        search: overrides?.search ?? search,
        status: overrides?.status ?? selectedStatus,
        branch_id: overrides?.branch_id ?? selectedBranch,
        order_type: overrides?.order_type ?? selectedOrderType,
      },
      { preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedBranch('');
    setSelectedOrderType('');
    router.get('/orders', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(search || selectedStatus || selectedBranch || selectedOrderType);

  const filteredTables = useMemo(() => {
    if (!createForm.data.branch_id) return tables;
    return tables.filter((t) => t.branch_id === Number(createForm.data.branch_id));
  }, [createForm.data.branch_id, tables]);

  const branchHasOpenShift =
    !createForm.data.branch_id || openShiftBranchIds.includes(Number(createForm.data.branch_id));

  // Kalkulasi pratinjau total order
  const summary = useMemo(() => {
    const subtotal = createForm.data.items.reduce(
      (acc, row) => acc + Number(row.qty || 0) * Number(row.unit_price || 0),
      0
    );
    const discount = Math.min(Number(createForm.data.discount_amount || 0), subtotal);
    const netSubtotal = Math.max(0, subtotal - discount);
    const service = createForm.data.apply_service ? Math.round(netSubtotal * 0.05) : 0;
    const tax = createForm.data.apply_tax ? Math.round((netSubtotal + service) * 0.1) : 0;
    const grandTotal = netSubtotal + service + tax;
    return { subtotal, discount, service, tax, grandTotal };
  }, [
    createForm.data.items,
    createForm.data.discount_amount,
    createForm.data.apply_service,
    createForm.data.apply_tax,
  ]);

  const openCreateModal = () => {
    createForm.clearErrors();
    createForm.setData({
      branch_id: branches.length === 1 ? String(branches[0].id) : '',
      order_type: 'DINE_IN',
      sales_mode_id: salesModes[0] ? String(salesModes[0].id) : '',
      table_id: '',
      discount_amount: 0,
      apply_tax: true,
      apply_service: true,
      items: [{ menu_item_id: '', qty: 1, unit_price: 0, notes: '' }],
    });
    setIsModalOpen(true);
  };

  const handleSalesModeChange = (modeId: string) => {
    const mode = salesModes.find((m) => m.id === Number(modeId));
    let inferredType: Order['order_type'] = createForm.data.order_type;
    const key = `${mode?.code || ''} ${mode?.name || ''}`.toUpperCase();
    if (key.includes('DINE')) inferredType = 'DINE_IN';
    else if (key.includes('TAKE')) inferredType = 'TAKE_AWAY';
    else if (key.includes('DELIVERY') || key.includes('GOFOOD') || key.includes('GRAB')) {
      inferredType = 'DELIVERY_AGGREGATOR';
    }

    createForm.setData((prev) => ({
      ...prev,
      sales_mode_id: modeId,
      order_type: inferredType,
      table_id: inferredType === 'DINE_IN' ? prev.table_id : '',
    }));
  };

  const handleAddItemRow = () => {
    createForm.setData('items', [
      ...createForm.data.items,
      { menu_item_id: '', qty: 1, unit_price: 0, notes: '' },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (createForm.data.items.length === 1) return;
    createForm.setData(
      'items',
      createForm.data.items.filter((_, i) => i !== index)
    );
  };

  const handleMenuSelect = (index: number, menuId: string) => {
    const updated = [...createForm.data.items];
    const selected = menuItems.find((m) => m.id === Number(menuId));
    updated[index] = {
      ...updated[index],
      menu_item_id: menuId,
      unit_price: selected ? Number(selected.selling_price) : 0,
    };
    createForm.setData('items', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/orders', {
      onSuccess: () => {
        setIsModalOpen(false);
        createForm.reset();
      },
    });
  };

  const handleStatusChange = (orderId: number, newStatus: Order['status']) => {
    if (newStatus === 'CANCELLED' && !confirm('Batalkan order ini?')) return;
    router.patch(`/orders/${orderId}/status`, { status: newStatus });
  };

  const openPayModal = (order: Order) => {
    setPaymentMethod('CASH');
    setAmountPaid(Number(order.grand_total));
    setPayingOrder(order);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder) return;
    router.patch(
      `/orders/${payingOrder.id}/status`,
      {
        status: 'PAID',
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'CASH' ? amountPaid : Number(payingOrder.grand_total),
      },
      {
        onSuccess: () => {
          setPayingOrder(null);
          setViewingOrder(null);
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <Head title="Riwayat Transaksi Order POS" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Order POS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar transaksi pesanan front-of-house, status produksi dapur, dan pelunasan kasir.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Order POS Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative w-full lg:w-72"
        >
          <input
            type="text"
            placeholder="Cari No. Order atau Meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              applyFilters({ branch_id: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.code}] {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedOrderType}
            onChange={(e) => {
              setSelectedOrderType(e.target.value);
              applyFilters({ order_type: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Tipe Order</option>
            <option value="DINE_IN">Dine-In</option>
            <option value="TAKE_AWAY">Take Away</option>
            <option value="DELIVERY_AGGREGATOR">Delivery / Online</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_KITCHEN">IN_KITCHEN</option>
            <option value="SERVED">SERVED</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">No. Order</th>
                <th className="py-3.5 px-4">Cabang</th>
                <th className="py-3.5 px-4">Tipe / Meja</th>
                <th className="py-3.5 px-4 text-center">Item</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Alur POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.data.length > 0 ? (
                orders.data.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setViewingOrder(o)}
                        className="font-mono font-bold text-indigo-600 hover:underline text-left"
                      >
                        {o.order_number}
                      </button>
                      <div className="text-[10px] text-slate-400">
                        {new Date(o.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {o.user?.name || 'Kasir'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold">{o.branch?.name || '-'}</td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {o.sales_mode?.name || ORDER_TYPE_LABEL[o.order_type] || o.order_type}
                      </span>
                      <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                        {o.table ? `Meja ${o.table.table_number}` : 'Tanpa Meja'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {o.items?.reduce((s, it) => s + Number(it.qty || 0), 0) ?? 0} qty
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(o.grand_total)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          STATUS_BADGE[o.status] || STATUS_BADGE.PENDING
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingOrder(o)}
                          title="Detail Struk Order"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye size={14} />
                        </button>

                        {o.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'IN_KITCHEN')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[10px] font-bold"
                          >
                            <Flame size={11} /> Masak
                          </button>
                        )}

                        {o.status === 'IN_KITCHEN' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'SERVED')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold"
                          >
                            <Utensils size={11} /> Sajikan
                          </button>
                        )}

                        {['PENDING', 'IN_KITCHEN', 'SERVED'].includes(o.status) && (
                          <>
                            <button
                              onClick={() => openPayModal(o)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-sm"
                            >
                              <CreditCard size={11} /> Bayar
                            </button>
                            <button
                              onClick={() => handleStatusChange(o.id, 'CANCELLED')}
                              title="Batalkan Order"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Ban size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada transaksi order POS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orders.links.length > 3 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{orders.from ?? 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{orders.to ?? 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{orders.total}</span> order
            </div>
            <div className="flex flex-wrap gap-1">
              {orders.links.map((link, idx) => (
                <button
                  key={idx}
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                    link.active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : link.url
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Order POS Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">Input Order POS Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {(createForm.errors as Record<string, string>).message && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{(createForm.errors as Record<string, string>).message}</span>
                </div>
              )}

              {!branchHasOpenShift && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    Cabang ini belum memiliki <strong>Shift Kasir OPEN</strong>. Buka shift terlebih dahulu di menu Shift Register Kasir.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang *</label>
                  <select
                    value={createForm.data.branch_id}
                    onChange={(e) =>
                      createForm.setData((prev) => ({
                        ...prev,
                        branch_id: e.target.value,
                        table_id: '',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.branch_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.branch_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Order *</label>
                  <select
                    value={createForm.data.order_type}
                    onChange={(e) => {
                      const val = e.target.value as Order['order_type'];
                      createForm.setData((prev) => ({
                        ...prev,
                        order_type: val,
                        table_id: val === 'DINE_IN' ? prev.table_id : '',
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="DINE_IN">Dine-In (Makan di Tempat)</option>
                    <option value="TAKE_AWAY">Take Away (Bungkus)</option>
                    <option value="DELIVERY_AGGREGATOR">Delivery / Aggregator</option>
                  </select>
                </div>

                {salesModes.length > 0 ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Channel</label>
                    <select
                      value={createForm.data.sales_mode_id}
                      onChange={(e) => handleSalesModeChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="">Default POS</option>
                      {salesModes.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Meja {createForm.data.order_type === 'DINE_IN' ? '*' : '(Opsional)'}
                    </label>
                    <select
                      disabled={createForm.data.order_type !== 'DINE_IN'}
                      value={createForm.data.table_id}
                      onChange={(e) => createForm.setData('table_id', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-50"
                    >
                      <option value="">Pilih Meja</option>
                      {filteredTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          Meja {t.table_number} ({t.status})
                        </option>
                      ))}
                    </select>
                    {createForm.errors.table_id && (
                      <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.table_id}</p>
                    )}
                  </div>
                )}
              </div>

              {salesModes.length > 0 && createForm.data.order_type === 'DINE_IN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Meja Dine-In *</label>
                  <select
                    value={createForm.data.table_id}
                    onChange={(e) => createForm.setData('table_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Meja</option>
                    {filteredTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Meja {t.table_number} ({t.status})
                      </option>
                    ))}
                  </select>
                  {createForm.errors.table_id && (
                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.table_id}</p>
                  )}
                </div>
              )}

              {/* Daftar Menu Pesanan */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800">Item Menu Pesanan *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Menu
                  </button>
                </div>

                {createForm.errors.items && (
                  <p className="text-[11px] text-rose-600 mb-2">{createForm.errors.items}</p>
                )}

                <div className="space-y-2">
                  {createForm.data.items.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <select
                        value={row.menu_item_id}
                        onChange={(e) => handleMenuSelect(idx, e.target.value)}
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="">Pilih Menu</option>
                        {menuItems.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatRupiah(m.selling_price)})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => {
                          const updated = [...createForm.data.items];
                          updated[idx] = { ...updated[idx], qty: Math.max(1, parseInt(e.target.value) || 1) };
                          createForm.setData('items', updated);
                        }}
                        className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-center"
                      />

                      <input
                        type="text"
                        placeholder="Catatan (pedas, es dikit...)"
                        value={row.notes}
                        onChange={(e) => {
                          const updated = [...createForm.data.items];
                          updated[idx] = { ...updated[idx], notes: e.target.value };
                          createForm.setData('items', updated);
                        }}
                        className="w-40 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />

                      {createForm.data.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Opsi Diskon & Pajak + Ringkasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Diskon Promo (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={createForm.data.discount_amount}
                      onChange={(e) => createForm.setData('discount_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.data.apply_service}
                      onChange={(e) => createForm.setData('apply_service', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Service Charge (5%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={createForm.data.apply_tax}
                      onChange={(e) => createForm.setData('apply_tax', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Pajak Restoran / PB1 (10%)</span>
                  </label>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatRupiah(summary.subtotal)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span className="font-mono">-{formatRupiah(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Service Charge (5%):</span>
                    <span className="font-mono">{formatRupiah(summary.service)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PB1 (10%):</span>
                    <span className="font-mono">{formatRupiah(summary.tax)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-600">{formatRupiah(summary.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing || !branchHasOpenShift}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {createForm.processing ? 'Memproses...' : 'Proses Order POS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Struk Order */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono text-slate-900">{viewingOrder.order_number}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    STATUS_BADGE[viewingOrder.status]
                  }`}
                >
                  {viewingOrder.status}
                </span>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.branch?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tipe / Meja</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {ORDER_TYPE_LABEL[viewingOrder.order_type]}{' '}
                    {viewingOrder.table ? `(Meja ${viewingOrder.table.table_number})` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kasir</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{viewingOrder.user?.name || '-'}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-3">Menu</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">{item.menu_item?.name}</div>
                          {item.notes && <div className="text-[10px] text-slate-400">Catatan: {item.notes}</div>}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{item.qty}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatRupiah(item.unit_price)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(viewingOrder.subtotal)}</span>
                </div>
                {Number(viewingOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatRupiah(viewingOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge:</span>
                  <span className="font-mono">{formatRupiah(viewingOrder.service_charge_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pajak PB1:</span>
                  <span className="font-mono">{formatRupiah(viewingOrder.tax_amount)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-indigo-600">{formatRupiah(viewingOrder.grand_total)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
              {['PENDING', 'IN_KITCHEN', 'SERVED'].includes(viewingOrder.status) && (
                <button
                  onClick={() => openPayModal(viewingOrder)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <CreditCard size={13} /> Proses Pembayaran
                </button>
              )}
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pelunasan Pembayaran */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pelunasan Order {payingOrder.order_number}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total Tagihan: <strong className="font-mono text-slate-800">{formatRupiah(payingOrder.grand_total)}</strong>
                </p>
              </div>
              <button onClick={() => setPayingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Metode Pembayaran *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'QRIS', 'DEBIT_CARD', 'TRANSFER'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg border font-bold text-xs transition-colors ${
                        paymentMethod === m
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uang Tunai Diterima (Rp)</label>
                  <input
                    type="number"
                    min={Number(payingOrder.grand_total)}
                    step="500"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-right"
                  />
                  <div className="mt-2 flex justify-between text-xs px-1">
                    <span className="text-slate-500">Kembalian:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatRupiah(Math.max(0, amountPaid - Number(payingOrder.grand_total)))}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Konfirmasi Lunas (PAID)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}