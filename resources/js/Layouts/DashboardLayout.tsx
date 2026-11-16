import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  Building2, Boxes, UtensilsCrossed, ShoppingCart, Truck,
  Warehouse, MonitorPlay, Receipt, Users, LayoutDashboard,
  ChevronDown, ChevronRight, Menu, X, Store, Landmark, Crown, Cpu,
  ExternalLink, Search, CornerDownLeft, CheckCircle2, AlertCircle, LogOut
} from 'lucide-react';

interface NavChild {
  title: string;
  href: string;
  target?: string;
  keywords?: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  keywords?: string;
  children?: NavChild[];
}

interface NavSection {
  group: string;
  items: NavItem[];
}

interface SearchableMenuItem {
  title: string;
  href: string;
  group: string;
  parentTitle?: string;
  target?: string;
  icon: React.ElementType;
  searchText: string;
}

const SIDEBAR_SCROLL_KEY = 'resto_enterprise_sidebar_scroll';
const ACTIVE_BRANCH_KEY = 'resto_enterprise_active_branch';

const navigationMenu: NavSection[] = [
  {
    group: 'UTAMA',
    items: [
      { title: 'Dashboard Analytics', href: '/dashboard', icon: LayoutDashboard, keywords: 'beranda home ringkasan omzet' },
    ],
  },
  {
    group: 'PERUSAHAAN & CABANG',
    items: [
      {
        title: 'Pengaturan Entitas',
        icon: Building2,
        children: [
          { title: 'Daftar Cabang', href: '/branches', keywords: 'outlet store cabang' },
          { title: 'Master Brand / Merk', href: '/brands', keywords: 'brand merek franchise' },
          { title: 'Hak Akses User', href: '/branch-users', keywords: 'user role permission akses pengguna' },
        ],
      },
    ],
  },
  {
    group: 'MASTER DATA DASAR',
    items: [
      {
        title: 'Parameter Inventaris',
        icon: Boxes,
        children: [
          { title: 'Satuan & Konversi', href: '/units', keywords: 'unit satuan gram kg liter pcs' },
          { title: 'Kategori Item', href: '/categories', keywords: 'kategori bahan baku' },
          { title: 'Lokasi Penyimpanan', href: '/storage-locations', keywords: 'gudang chiller freezer rack' },
          { title: 'Master Supplier', href: '/suppliers', keywords: 'vendor pemasok supplier' },
        ],
      },
    ],
  },
  {
    group: 'PRODUK, MENU & RESEP',
    items: [
      {
        title: 'Master Barang (SKU)',
        icon: Store,
        children: [
          { title: 'SKU Item Global', href: '/items', keywords: 'barang bahan sku item' },
          { title: 'Setting Item per Cabang', href: '/branch-items', keywords: 'harga stok cabang' },
        ],
      },
      {
        title: 'Engineering Menu POS',
        icon: UtensilsCrossed,
        children: [
          { title: 'Daftar Menu Penjualan', href: '/menu-items', keywords: 'produk menu makanan minuman' },
          { title: 'Menu Extras / Topping', href: '/menu-extras', keywords: 'modifier topping add on' },
          { title: 'Paket Combo / Bundling', href: '/menu-packages', keywords: 'paket bundling promo' },
          { title: 'Resep & BOM (Costing)', href: '/recipes', keywords: 'resep hpp bom food cost' },
        ],
      },
    ],
  },
  {
    group: 'LOGISTIK & STOK',
    items: [
      {
        title: 'Pengadaan (Procurement)',
        icon: ShoppingCart,
        children: [
          { title: 'Purchase Order (PO)', href: '/purchase-orders', keywords: 'po pembelian order supplier' },
          { title: 'Penerimaan Barang (GR)', href: '/goods-receipts', keywords: 'gr receiving terima barang' },
        ],
      },
      {
        title: 'Mutasi & Produksi',
        icon: Truck,
        children: [
          { title: 'Transfer Antar Cabang', href: '/transfer-orders', keywords: 'mutasi kirim stok antar outlet' },
          { title: 'Produksi Central Kitchen', href: '/production-orders', keywords: 'ck produksi central kitchen' },
        ],
      },
      {
        title: 'Kontrol & Audit Stok',
        icon: Warehouse,
        children: [
          { title: 'Batch Stok FEFO', href: '/stock-batches', keywords: 'batch expired kadaluarsa fefo' },
          { title: 'Pergerakan Stok (Ledger)', href: '/stock-movements', keywords: 'kartu stok mutasi keluar masuk' },
          { title: 'Pencatatan Waste / Susut', href: '/waste-logs', keywords: 'waste rusak busuk susut' },
          { title: 'Stock Opname', href: '/stock-counts', keywords: 'opname audit fisik stok' },
        ],
      },
    ],
  },
  {
    group: 'OPERASIONAL POS',
    items: [
      {
        title: 'Front-of-House Setup',
        icon: MonitorPlay,
        children: [
          { title: 'Layout Meja & Denah', href: '/floors-tables', keywords: 'meja lantai denah floor table' },
          { title: 'Station Dapur & Printer', href: '/stations', keywords: 'printer checker bar kitchen station' },
          { title: 'Mode Penjualan (Sales Mode)', href: '/sales-modes', keywords: 'dine in takeaway gofood grabfood' },
          { title: 'Alasan Pembatalan (Void)', href: '/cancel-reasons', keywords: 'void batal cancel' },
          { title: 'Manajemen Diskon', href: '/discounts', keywords: 'diskon voucher promo potongan' },
        ],
      },
      {
        title: 'Transaksi & Kasir',
        icon: Receipt,
        children: [
          { title: 'Register Shift Kasir', href: '/shifts', keywords: 'shift kasir buka tutup kas' },
          { title: 'Riwayat Transaksi Order', href: '/orders', keywords: 'struk bill transaksi penjualan order' },
        ],
      },
    ],
  },
  {
    group: 'KEUANGAN & AKUNTANSI',
    items: [
      {
        title: 'Buku Besar & Kas',
        icon: Landmark,
        children: [
          { title: 'Chart of Accounts (COA)', href: '/chart-of-accounts', keywords: 'coa akun perkiraan akuntansi' },
          { title: 'Cost Center (Pusat Biaya)', href: '/cost-centers', keywords: 'cost center departemen biaya' },
          { title: 'Jurnal Umum', href: '/journals', keywords: 'jurnal debit kredit double entry' },
          { title: 'Hutang Supplier (AP)', href: '/accounts-payable', keywords: 'ap hutang tagihan supplier' },
          { title: 'Piutang Aggregator (AR)', href: '/accounts-receivable', keywords: 'ar piutang pencairan gofood grab edc' },
          { title: 'Kas Kecil (Petty Cash)', href: '/petty-cash', keywords: 'petty cash kas kecil pengeluaran' },
        ],
      },
    ],
  },
  {
    group: 'SDM & PELANGGAN',
    items: [
      {
        title: 'HRIS & Payroll',
        icon: Users,
        children: [
          { title: 'Data Karyawan', href: '/employees', keywords: 'pegawai staff karyawan nik' },
          { title: 'Jadwal Shift Kerja', href: '/work-shifts', keywords: 'jadwal kerja roster shift' },
          { title: 'Presensi Karyawan', href: '/attendances', keywords: 'absensi kehadiran jam masuk pulang' },
          { title: 'Alokasi Service Charge', href: '/service-charges', keywords: 'service charge bagi hasil' },
          { title: 'Penggajian (Payroll)', href: '/payrolls', keywords: 'gaji slip gaji thp lembur payroll' },
        ],
      },
      { title: 'Tingkat Membership', href: '/membership-types', icon: Crown, keywords: 'member loyalty pelanggan poin' },
    ],
  },
  {
    group: 'EKOSISTEM & INTEGRASI PLATFORM',
    items: [
      {
        title: 'Hub Integrasi Multi-Platform',
        icon: Cpu,
        children: [
          { title: '1. Kasir POS (Flutter EXE/APK)', href: '/platforms/pos-app', target: '_blank', keywords: 'pos kasir flutter' },
          { title: '2. Pemesanan QR Meja (React Mobile Web)', href: '/platforms/qr-order', target: '_blank', keywords: 'qr self order meja' },
          { title: '3. Kiosk Mandiri (React Kiosk Touchscreen)', href: '/platforms/kiosk-order', target: '_blank', keywords: 'kiosk self service' },
          { title: '4. Kitchen Display System / KDS (Flutter)', href: '/platforms/kds-dapur', target: '_blank', keywords: 'kds layar dapur' },
          { title: '5. Monitor Antrean / Queue Display (React)', href: '/platforms/queue-display', target: '_blank', keywords: 'queue antrean layar' },
        ],
      },
    ],
  },
];

const checkUrlActive = (currentUrl: string, href?: string) => {
  if (!href) return false;
  const cleanUrl = currentUrl.split('?')[0];
  if (href === '/dashboard') return cleanUrl === '/dashboard';
  return cleanUrl === href || cleanUrl.startsWith(href + '/');
};

const findActiveParentTitle = (currentUrl: string): string | null => {
  for (const section of navigationMenu) {
    for (const item of section.items) {
      if (item.children?.some((child) => checkUrlActive(currentUrl, child.href))) {
        return item.title;
      }
    }
  }
  return null;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const page = usePage();
  const { url } = page;
  const pageProps = (page.props || {}) as Record<string, any>;

  const authUser = pageProps.auth?.user;
  const sharedBranches: { id: number; name: string; code: string }[] = Array.isArray(pageProps.branches)
    ? pageProps.branches
    : [];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Inisialisasi sinkron agar submenu sudah terbuka pada frame render pertama (mencegah tinggi sidebar lompat)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => findActiveParentTitle(url));
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_BRANCH_KEY) || 'all';
    }
    return 'all';
  });

  // State Global Search (Command Palette)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchIdx, setSelectedSearchIdx] = useState(0);

  // State Flash Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isUrlActive = (href?: string) => checkUrlActive(url, href);

  // Sinkronkan submenu terbuka saat URL berubah & tutup drawer mobile
  useEffect(() => {
    const activeParent = findActiveParentTitle(url);
    if (activeParent) {
      setOpenSubmenu(activeParent);
    }
    setSidebarOpen(false);
  }, [url]);

  // Pulihkan posisi scroll sidebar sebelum browser paint agar tidak kembali ke atas
  useLayoutEffect(() => {
    const container = navScrollRef.current;
    if (!container) return;

    const savedScroll = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (savedScroll !== null) {
      container.scrollTop = Number(savedScroll);
    }

    // Pastikan item menu aktif tetap terlihat jika dibuka via Global Search
    const activeEl = container.querySelector('[data-active-nav="true"]') as HTMLElement | null;
    if (activeEl) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const isOutOfView =
        activeRect.top < containerRect.top + 16 || activeRect.bottom > containerRect.bottom - 16;

      if (isOutOfView) {
        activeEl.scrollIntoView({ block: 'nearest' });
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(container.scrollTop));
      }
    }
  }, [url]);

  const handleSidebarScroll = () => {
    if (navScrollRef.current) {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(navScrollRef.current.scrollTop));
    }
  };

  // Tangkap flash success / error dari Laravel Inertia
  useEffect(() => {
    const flashSuccess = pageProps.flash?.success;
    const flashError = pageProps.flash?.error || pageProps.errors?.message;

    if (flashSuccess) {
      setToast({ type: 'success', message: flashSuccess });
    } else if (flashError) {
      setToast({ type: 'error', message: flashError });
    }
  }, [pageProps.flash?.success, pageProps.flash?.error, pageProps.errors?.message]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Shortcut Keyboard Ctrl+K / Cmd+K untuk Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setSearchQuery('');
      setSelectedSearchIdx(0);
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [isSearchOpen]);

  // Flatten seluruh menu untuk Global Search
  const allSearchableMenus = useMemo<SearchableMenuItem[]>(() => {
    const list: SearchableMenuItem[] = [];
    navigationMenu.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.length) {
          item.children.forEach((child) => {
            list.push({
              title: child.title,
              href: child.href,
              group: section.group,
              parentTitle: item.title,
              target: child.target,
              icon: item.icon,
              searchText: `${child.title} ${item.title} ${section.group} ${child.href} ${child.keywords || ''}`.toLowerCase(),
            });
          });
        } else if (item.href) {
          list.push({
            title: item.title,
            href: item.href,
            group: section.group,
            icon: item.icon,
            searchText: `${item.title} ${section.group} ${item.href} ${item.keywords || ''}`.toLowerCase(),
          });
        }
      });
    });
    return list;
  }, []);

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSearchableMenus;
    const tokens = q.split(/\s+/);
    return allSearchableMenus.filter((m) => tokens.every((t) => m.searchText.includes(t)));
  }, [searchQuery, allSearchableMenus]);

  useEffect(() => {
    setSelectedSearchIdx(0);
  }, [searchQuery]);

  // Breadcrumb halaman aktif
  const activeBreadcrumb = useMemo(() => {
    for (const section of navigationMenu) {
      for (const item of section.items) {
        if (item.children) {
          const matchedChild = item.children.find((c) => isUrlActive(c.href));
          if (matchedChild) {
            return { group: section.group, parent: item.title, current: matchedChild.title };
          }
        } else if (isUrlActive(item.href)) {
          return { group: section.group, parent: null, current: item.title };
        }
      }
    }
    return null;
  }, [url]);

  const handleSelectSearchItem = (item: SearchableMenuItem) => {
    setIsSearchOpen(false);
    if (item.target === '_blank') {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else {
      router.visit(item.href);
    }
  };

  const handleSearchModalKeyDown = (e: React.KeyboardEvent) => {
    if (filteredMenus.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev + 1) % filteredMenus.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev - 1 + filteredMenus.length) % filteredMenus.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetItem = filteredMenus[selectedSearchIdx];
      if (targetItem) handleSelectSearchItem(targetItem);
    }
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu((prev) => (prev === title ? null : title));
  };

  const handleBranchChange = (val: string) => {
    setActiveBranch(val);
    localStorage.setItem(ACTIVE_BRANCH_KEY, val);
  };

  const handleLogout = () => {
    if (confirm('Keluar dari sesi Resto Enterprise Workspace?')) {
      router.post('/logout');
    }
  };

  const userName = authUser?.name || 'Zein Niko';
  const userRole = authUser?.role || 'Super Admin';
  const userInitials = userName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[60] max-w-sm w-full p-3.5 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/95 border-rose-200 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
              R
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-slate-900">RESTO-ENTERPRISE</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">HQ ERP & POS</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Branch Selector */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Cabang Aktif
          </label>
          <div className="relative">
            <select
              value={activeBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer shadow-sm"
            >
              <option value="all">Semua Cabang (Global HQ)</option>
              {sharedBranches.length > 0 ? (
                sharedBranches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    [{b.code}] {b.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">CK - Central Kitchen Palembang</option>
                  <option value="2">Outlet 01 - RTA Center</option>
                </>
              )}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Items (Scrollable with State Persistence) */}
        <div
          ref={navScrollRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {navigationMenu.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3">
                {section.group}
              </h2>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children?.length);
                  const hasActiveChild = item.children?.some((child) => isUrlActive(child.href));
                  const isOpen = openSubmenu === item.title;
                  const isSingleActive = !hasChildren && isUrlActive(item.href);

                  return (
                    <div key={itemIdx}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.title)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            hasActiveChild || isOpen
                              ? 'bg-indigo-50 text-indigo-600 font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-left">
                            <Icon
                              size={16}
                              className={`shrink-0 ${hasActiveChild || isOpen ? 'text-indigo-600' : 'text-slate-400'}`}
                            />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href || '#'}
                          preserveScroll
                          data-active-nav={isSingleActive ? 'true' : undefined}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            isSingleActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={16} className={`shrink-0 ${isSingleActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.title}</span>
                        </Link>
                      )}

                      {/* Submenu Dropdown Rendering */}
                      {hasChildren && isOpen && (
                        <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-200 ml-5">
                          {item.children?.map((child, childIdx) => {
                            const isChildActive = isUrlActive(child.href);
                            const isExternalTab = child.target === '_blank';

                            return isExternalTab ? (
                              <a
                                key={childIdx}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 text-xs rounded transition-colors text-slate-600 hover:text-indigo-600 hover:bg-slate-100 flex items-center justify-between gap-2 group"
                              >
                                <span className="leading-snug">{child.title}</span>
                                <ExternalLink
                                  size={12}
                                  className="shrink-0 text-slate-400 group-hover:text-indigo-600"
                                />
                              </a>
                            ) : (
                              <Link
                                key={childIdx}
                                href={child.href}
                                preserveScroll
                                data-active-nav={isChildActive ? 'true' : undefined}
                                className={`block py-1.5 px-2.5 text-xs rounded transition-colors ${
                                  isChildActive
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
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">
              {userInitials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userRole}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Keluar (Logout)"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 shadow-sm">
          {/* Left: Mobile Trigger & Active Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>

            {activeBreadcrumb ? (
              <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {activeBreadcrumb.group}
                </span>
                {activeBreadcrumb.parent && (
                  <>
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                    <span className="font-medium text-slate-600 truncate">{activeBreadcrumb.parent}</span>
                  </>
                )}
                <ChevronRight size={13} className="text-slate-300 shrink-0" />
                <span className="font-semibold text-slate-900 truncate">{activeBreadcrumb.current}</span>
              </nav>
            ) : (
              <span className="hidden sm:inline text-xs font-medium text-slate-500">
                Resto Enterprise Workspace
              </span>
            )}
          </div>

          {/* Right: Global Menu Search Trigger & Environment Pill */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-48 sm:w-64 lg:w-72 flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/90 hover:border-indigo-300 rounded-lg text-xs text-slate-500 transition-all"
            >
              <span className="flex items-center gap-2 truncate">
                <Search size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">Cari menu cepat...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs shrink-0">
                Ctrl K
              </kbd>
            </button>

            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Online
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50">{children}</main>
      </div>

      {/* Global Menu Search Modal (Command Palette) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
              <Search size={18} className="text-indigo-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchModalKeyDown}
                placeholder="Ketik nama menu, modul, atau kata kunci (misal: Jurnal, Opname, Payroll, KDS)..."
                className="flex-1 text-sm text-slate-900 placeholder-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded"
              >
                ESC
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredMenus.length > 0 ? (
                filteredMenus.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedSearchIdx;
                  const isCurrent = isUrlActive(item.href);

                  return (
                    <button
                      key={`${item.href}-${idx}`}
                      type="button"
                      onMouseEnter={() => setSelectedSearchIdx(idx)}
                      onClick={() => handleSelectSearchItem(item)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : isCurrent
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center gap-2">
                            <span>{item.title}</span>
                            {isCurrent && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                Aktif
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] truncate mt-0.5 ${
                              isSelected ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {item.group}
                            {item.parentTitle ? ` • ${item.parentTitle}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.target === '_blank' ? (
                          <ExternalLink size={13} className={isSelected ? 'text-indigo-100' : 'text-slate-400'} />
                        ) : (
                          <CornerDownLeft size={13} className={isSelected ? 'text-indigo-100' : 'text-slate-300'} />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  Tidak ditemukan menu yang cocok dengan <span className="font-semibold text-slate-600">"{searchQuery}"</span>.
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↑↓</kbd> Navigasi
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">Enter</kbd> Buka Menu
                </span>
              </div>
              <span>{filteredMenus.length} modul tersedia</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}