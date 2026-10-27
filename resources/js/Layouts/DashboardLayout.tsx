import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Building2, Boxes, UtensilsCrossed, ShoppingCart, Truck,
  Warehouse, MonitorPlay, Receipt, Users, LayoutDashboard,
  ChevronDown, Menu, X, Store, Landmark, Crown, Cpu, ExternalLink
} from 'lucide-react';

interface NavChild {
  title: string;
  href: string;
  target?: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const navigationMenu: NavSection[] = [
  {
    group: 'UTAMA',
    items: [
      { title: 'Dashboard Analytics', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'PERUSAHAAN & CABANG',
    items: [
      {
        title: 'Pengaturan Entitas',
        icon: Building2,
        children: [
          { title: 'Daftar Cabang', href: '/branches' },
          { title: 'Master Brand / Merk', href: '/brands' },
          { title: 'Hak Akses User', href: '/branch-users' },
        ]
      },
    ]
  },
  {
    group: 'MASTER DATA DASAR',
    items: [
      {
        title: 'Parameter Inventaris',
        icon: Boxes,
        children: [
          { title: 'Kategori Item', href: '/categories' },
          { title: 'Satuan & Konversi', href: '/units' },
          { title: 'Lokasi Penyimpanan', href: '/storage-locations' },
          { title: 'Master Supplier', href: '/suppliers' },
        ]
      },
    ]
  },
  {
    group: 'PRODUK, MENU & RESEP',
    items: [
      {
        title: 'Master Barang (SKU)',
        icon: Store,
        children: [
          { title: 'SKU Item Global', href: '/items' },
          { title: 'Setting Item per Cabang', href: '/branch-items' },
        ]
      },
      {
        title: 'Engineering Menu POS',
        icon: UtensilsCrossed,
        children: [
          { title: 'Daftar Menu Penjualan', href: '/menu-items' },
          { title: 'Menu Extras / Topping', href: '/menu-extras' },
          { title: 'Paket Combo / Bundling', href: '/menu-packages' },
          { title: 'Resep & BOM (Costing)', href: '/recipes' },
        ]
      },
    ]
  },
  {
    group: 'LOGISTIK & STOK',
    items: [
      {
        title: 'Pengadaan (Procurement)',
        icon: ShoppingCart,
        children: [
          { title: 'Purchase Order (PO)', href: '/purchase-orders' },
          { title: 'Penerimaan Barang (GR)', href: '/goods-receipts' },
        ]
      },
      {
        title: 'Mutasi & Produksi',
        icon: Truck,
        children: [
          { title: 'Transfer Antar Cabang', href: '/transfer-orders' },
          { title: 'Produksi Central Kitchen', href: '/production-orders' },
        ]
      },
      {
        title: 'Kontrol & Audit Stok',
        icon: Warehouse,
        children: [
          { title: 'Batch Stok FEFO', href: '/stock-batches' },
          { title: 'Pergerakan Stok (Ledger)', href: '/stock-movements' },
          { title: 'Pencatatan Waste / Susut', href: '/waste-logs' },
          { title: 'Stock Opname', href: '/stock-counts' },
        ]
      },
    ]
  },
  {
    group: 'OPERASIONAL POS',
    items: [
      {
        title: 'Front-of-House Setup',
        icon: MonitorPlay,
        children: [
          { title: 'Layout Meja & Denah', href: '/floors-tables' },
          { title: 'Station Dapur & Printer', href: '/stations' },
          { title: 'Mode Penjualan (Sales Mode)', href: '/sales-modes' },
          { title: 'Alasan Pembatalan (Void)', href: '/cancel-reasons' },
          { title: 'Manajemen Diskon', href: '/discounts' },
        ]
      },
      {
        title: 'Transaksi & Kasir',
        icon: Receipt,
        children: [
          { title: 'Register Shift Kasir', href: '/shifts' },
          { title: 'Riwayat Transaksi Order', href: '/orders' },
        ]
      },
    ]
  },
  {
    group: 'KEUANGAN & AKUNTANSI',
    items: [
      {
        title: 'Buku Besar & Kas',
        icon: Landmark,
        children: [
          { title: 'Chart of Accounts (COA)', href: '/chart-of-accounts' },
          { title: 'Cost Center (Pusat Biaya)', href: '/cost-centers' },
          { title: 'Jurnal Umum', href: '/journals' },
          { title: 'Hutang Supplier (AP)', href: '/accounts-payable' },
          { title: 'Piutang Aggregator (AR)', href: '/accounts-receivable' },
          { title: 'Kas Kecil (Petty Cash)', href: '/petty-cash' },
        ]
      },
    ]
  },
  {
    group: 'SDM & PELANGGAN',
    items: [
      {
        title: 'HRIS & Payroll',
        icon: Users,
        children: [
          { title: 'Data Karyawan', href: '/employees' },
          { title: 'Jadwal Shift Kerja', href: '/work-shifts' },
          { title: 'Presensi Karyawan', href: '/attendances' },
          { title: 'Alokasi Service Charge', href: '/service-charges' },
          { title: 'Penggajian (Payroll)', href: '/payrolls' },
        ]
      },
      { title: 'Tingkat Membership', href: '/membership-types', icon: Crown },
    ]
  },
  {
    group: 'EKOSISTEM & INTEGRASI PLATFORM',
    items: [
      {
        title: 'Hub Integrasi Multi-Platform',
        icon: Cpu,
        children: [
          { title: '1. Kasir POS (Flutter EXE/APK)', href: '/platforms/pos-app', target: '_blank' },
          { title: '2. Pemesanan QR Meja (React Mobile Web)', href: '/platforms/qr-order', target: '_blank' },
          { title: '3. Kiosk Mandiri (React Kiosk Touchscreen)', href: '/platforms/kiosk-order', target: '_blank' },
          { title: '4. Kitchen Display System / KDS (Flutter)', href: '/platforms/kds-dapur', target: '_blank' },
          { title: '5. Monitor Antrean / Queue Display (React)', href: '/platforms/queue-display', target: '_blank' },
        ]
      }
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const isUrlActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return url === '/dashboard';
    return url === href || url.startsWith(href + '/') || (href !== '/' && url.startsWith(href));
  };

  useEffect(() => {
    navigationMenu.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => isUrlActive(child.href));
          if (hasActiveChild) {
            setOpenSubmenu(item.title);
          }
        }
      });
    });
  }, [url]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
              R
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-slate-900">RESTO-ENTERPRISE</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">HQ Dashboard</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Branch Selector */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Cabang Aktif</label>
          <div className="relative">
            <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer shadow-sm">
              <option value="all">Semua Cabang (Global HQ)</option>
              <option value="1">CK - Central Kitchen Palembang</option>
              <option value="2">Outlet 01 - RTA Center</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationMenu.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3">
                {section.group}
              </h2>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children?.length);
                  const hasActiveChild = item.children?.some(child => isUrlActive(child.href));
                  const isOpen = openSubmenu === item.title;
                  const isSingleActive = !hasChildren && isUrlActive(item.href);

                  return (
                    <div key={itemIdx}>
                      {hasChildren ? (
                        <button
                          onClick={() => toggleSubmenu(item.title)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${hasActiveChild || isOpen
                              ? 'bg-indigo-50 text-indigo-600 font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className={hasActiveChild || isOpen ? 'text-indigo-600' : 'text-slate-400'} />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <Link
                          href={item.href || '#'}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isSingleActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <Icon size={16} className={isSingleActive ? 'text-white' : 'text-slate-400'} />
                          <span>{item.title}</span>
                        </Link>
                      )}

                      {/* Submenu Dropdown Rendering */}
                      {hasChildren && isOpen && (
                        <div className="pl-9 pr-2 py-1 space-y-1 mt-1 border-l-2 border-slate-200 ml-5">
                          {item.children?.map((child: any, childIdx: number) => {
                            const isChildActive = isUrlActive(child.href);
                            const isExternalTab = child.target === '_blank';

                            return isExternalTab ? (
                              <a
                                key={childIdx}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 text-xs rounded transition-colors text-slate-600 hover:text-indigo-600 hover:bg-slate-100 flex items-center justify-between group"
                              >
                                <span>{child.title}</span>
                                <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-600" />
                              </a>
                            ) : (
                              <Link
                                key={childIdx}
                                href={child.href}
                                className={`block py-1.5 px-2.5 text-xs rounded transition-colors ${isChildActive
                                    ? 'text-indigo-600 font-bold bg-indigo-50'
                                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                                  }`}
                              >
                                {child.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-600">
              ZN
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">Zein Niko</p>
              <p className="text-[10px] text-slate-500 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-900 p-1">
              <Menu size={20} />
            </button>
            <span className="text-xs font-medium text-slate-500">Resto Enterprise Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              v1.0.0 Dev
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}