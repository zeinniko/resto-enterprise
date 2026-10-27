<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\StorageLocationController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\TransferOrderController;
use App\Http\Controllers\ProductionOrderController;
use App\Http\Controllers\StockBatchController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\WasteLogController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\FloorTableController;
use App\Http\Controllers\StationController;
use App\Http\Controllers\SalesModeController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\CostCenterController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\AccountsPayableController;
use App\Http\Controllers\AccountsReceivableController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MembershipTypeController;

// Root Redirect & Dashboard
Route::get('/', fn() => redirect()->route('dashboard'));
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

/* 1. CORE & BRANCHES */
Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');
Route::post('/branches', [BranchController::class, 'store'])->name('branches.store');
Route::put('/branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');

/* 2. INVENTARIS & MENU */
Route::get('/items', [ItemController::class, 'index'])->name('items.index');
Route::post('/items', [ItemController::class, 'store'])->name('items.store');
Route::put('/items/{item}', [ItemController::class, 'update'])->name('items.update');
Route::delete('/items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');

Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

Route::get('/units', [UnitController::class, 'index'])->name('units.index');
Route::post('/units', [UnitController::class, 'store'])->name('units.store');
Route::put('/units/{unit}', [UnitController::class, 'update'])->name('units.update');
Route::delete('/units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');

Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

Route::get('/storage-locations', [StorageLocationController::class, 'index'])->name('storage-locations.index');
Route::post('/storage-locations', [StorageLocationController::class, 'store'])->name('storage-locations.store');
Route::put('/storage-locations/{storageLocation}', [StorageLocationController::class, 'update'])->name('storage-locations.update');
Route::delete('/storage-locations/{storageLocation}', [StorageLocationController::class, 'destroy'])->name('storage-locations.destroy');

Route::get('/menu-items', [MenuItemController::class, 'index'])->name('menu-items.index');
Route::post('/menu-items', [MenuItemController::class, 'store'])->name('menu-items.store');
Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update'])->name('menu-items.update');
Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy'])->name('menu-items.destroy');

Route::get('/recipes', [RecipeController::class, 'index'])->name('recipes.index');
Route::post('/recipes', [RecipeController::class, 'store'])->name('recipes.store');
Route::put('/recipes/{recipe}', [RecipeController::class, 'update'])->name('recipes.update');
Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('recipes.destroy');

/* 3. LOGISTIK & STOK */
Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
Route::patch('/purchase-orders/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus'])->name('purchase-orders.update-status');
Route::delete('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy');

Route::get('/goods-receipts', [GoodsReceiptController::class, 'index'])->name('goods-receipts.index');
Route::post('/goods-receipts', [GoodsReceiptController::class, 'store'])->name('goods-receipts.store');

Route::get('/transfer-orders', [TransferOrderController::class, 'index'])->name('transfer-orders.index');
Route::post('/transfer-orders', [TransferOrderController::class, 'store'])->name('transfer-orders.store');
Route::patch('/transfer-orders/{transferOrder}/ship', [TransferOrderController::class, 'ship'])->name('transfer-orders.ship');
Route::post('/transfer-orders/{transferOrder}/receive', [TransferOrderController::class, 'receive'])->name('transfer-orders.receive');

Route::get('/production-orders', [ProductionOrderController::class, 'index'])->name('production-orders.index');
Route::post('/production-orders', [ProductionOrderController::class, 'store'])->name('production-orders.store');
Route::post('/production-orders/{productionOrder}/complete', [ProductionOrderController::class, 'complete'])->name('production-orders.complete');

Route::get('/stock-batches', [StockBatchController::class, 'index'])->name('stock-batches.index');
Route::get('/stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index');
Route::get('/waste-logs', [WasteLogController::class, 'index'])->name('waste-logs.index');
Route::post('/waste-logs', [WasteLogController::class, 'store'])->name('waste-logs.store');
Route::get('/stock-counts', [StockCountController::class, 'index'])->name('stock-counts.index');
Route::post('/stock-counts', [StockCountController::class, 'store'])->name('stock-counts.store');
Route::post('/stock-counts/{stockCount}/approve', [StockCountController::class, 'approve'])->name('stock-counts.approve');

/* 4. POS & OPERASIONAL */
Route::get('/floors-tables', [FloorTableController::class, 'index'])->name('floors-tables.index');
Route::post('/floors', [FloorTableController::class, 'storeFloor'])->name('floors.store');
Route::post('/tables', [FloorTableController::class, 'storeTable'])->name('tables.store');
Route::patch('/tables/{table}/status', [FloorTableController::class, 'updateTableStatus'])->name('tables.update-status');

Route::get('/stations', [StationController::class, 'index'])->name('stations.index');
Route::post('/stations', [StationController::class, 'store'])->name('stations.store');
Route::put('/stations/{station}', [StationController::class, 'update'])->name('stations.update');
Route::delete('/stations/{station}', [StationController::class, 'destroy'])->name('stations.destroy');

Route::get('/sales-modes', [SalesModeController::class, 'index'])->name('sales-modes.index');
Route::post('/sales-modes', [SalesModeController::class, 'store'])->name('sales-modes.store');
Route::put('/sales-modes/{salesMode}', [SalesModeController::class, 'update'])->name('sales-modes.update');
Route::delete('/sales-modes/{salesMode}', [SalesModeController::class, 'destroy'])->name('sales-modes.destroy');

Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
Route::post('/shifts', [ShiftController::class, 'store'])->name('shifts.store');
Route::post('/shifts/{shift}/close', [ShiftController::class, 'close'])->name('shifts.close');

Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

/* 5. KEUANGAN & AKUNTANSI */
Route::get('/chart-of-accounts', [ChartOfAccountController::class, 'index'])->name('chart-of-accounts.index');
Route::post('/chart-of-accounts', [ChartOfAccountController::class, 'store'])->name('chart-of-accounts.store');
Route::put('/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'update'])->name('chart-of-accounts.update');
Route::delete('/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'destroy'])->name('chart-of-accounts.destroy');

Route::get('/cost-centers', [CostCenterController::class, 'index'])->name('cost-centers.index');
Route::post('/cost-centers', [CostCenterController::class, 'store'])->name('cost-centers.store');
Route::put('/cost-centers/{costCenter}', [CostCenterController::class, 'update'])->name('cost-centers.update');
Route::delete('/cost-centers/{costCenter}', [CostCenterController::class, 'destroy'])->name('cost-centers.destroy');

Route::get('/journals', [JournalController::class, 'index'])->name('journals.index');
Route::post('/journals', [JournalController::class, 'store'])->name('journals.store');

Route::get('/accounts-payable', [AccountsPayableController::class, 'index'])->name('accounts-payable.index');
Route::post('/accounts-payable/{accountsPayable}/pay', [AccountsPayableController::class, 'pay'])->name('accounts-payable.pay');

Route::get('/accounts-receivable', [AccountsReceivableController::class, 'index'])->name('accounts-receivable.index');
Route::post('/accounts-receivable/{accountsReceivable}/settle', [AccountsReceivableController::class, 'settle'])->name('accounts-receivable.settle');

/* 6. HRIS & MEMBERSHIP */
Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

Route::get('/membership-types', [MembershipTypeController::class, 'index'])->name('membership-types.index');
Route::post('/membership-types', [MembershipTypeController::class, 'store'])->name('membership-types.store');
Route::put('/membership-types/{membershipType}', [MembershipTypeController::class, 'update'])->name('membership-types.update');
Route::delete('/membership-types/{membershipType}', [MembershipTypeController::class, 'destroy'])->name('membership-types.destroy');


use App\Http\Controllers\BrandController;
use App\Http\Controllers\MenuExtraController;

// 1. Brand Routes
Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');
Route::post('/brands', [BrandController::class, 'store'])->name('brands.store');
Route::put('/brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
Route::delete('/brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');

// 2. Menu Extra Routes
Route::get('/menu-extras', [MenuExtraController::class, 'index'])->name('menu-extras.index');
Route::post('/menu-extras', [MenuExtraController::class, 'store'])->name('menu-extras.store');
Route::put('/menu-extras/{menuExtra}', [MenuExtraController::class, 'update'])->name('menu-extras.update');
Route::delete('/menu-extras/{menuExtra}', [MenuExtraController::class, 'destroy'])->name('menu-extras.destroy');


use App\Http\Controllers\BranchUserController;
use App\Http\Controllers\BranchItemController;
use App\Http\Controllers\MenuPackageController;
use App\Http\Controllers\CancelReasonController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\PettyCashController;
use App\Http\Controllers\WorkShiftController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ServiceChargeController;
use App\Http\Controllers\PayrollController;

// Branch Users & Items
Route::get('/branch-users', [BranchUserController::class, 'index'])->name('branch-users.index');
Route::put('/branch-users/{user}', [BranchUserController::class, 'update'])->name('branch-users.update');

Route::get('/branch-items', [BranchItemController::class, 'index'])->name('branch-items.index');
Route::post('/branch-items', [BranchItemController::class, 'store'])->name('branch-items.store');

// Menu Packages
Route::get('/menu-packages', [MenuPackageController::class, 'index'])->name('menu-packages.index');
Route::post('/menu-packages', [MenuPackageController::class, 'store'])->name('menu-packages.store');

// Cancel Reasons & Discounts
Route::get('/cancel-reasons', [CancelReasonController::class, 'index'])->name('cancel-reasons.index');
Route::post('/cancel-reasons', [CancelReasonController::class, 'store'])->name('cancel-reasons.store');

Route::get('/discounts', [DiscountController::class, 'index'])->name('discounts.index');
Route::post('/discounts', [DiscountController::class, 'store'])->name('discounts.store');
Route::put('/discounts/{discount}', [DiscountController::class, 'update'])->name('discounts.update');
Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy'])->name('discounts.destroy');

// Petty Cash
Route::get('/petty-cash', [PettyCashController::class, 'index'])->name('petty-cash.index');
Route::post('/petty-cash', [PettyCashController::class, 'store'])->name('petty-cash.store');

// HRIS
Route::get('/work-shifts', [WorkShiftController::class, 'index'])->name('work-shifts.index');
Route::post('/work-shifts', [WorkShiftController::class, 'store'])->name('work-shifts.store');

Route::get('/attendances', [AttendanceController::class, 'index'])->name('attendances.index');
Route::post('/attendances', [AttendanceController::class, 'store'])->name('attendances.store');

Route::get('/service-charges', [ServiceChargeController::class, 'index'])->name('service-charges.index');
Route::post('/service-charges', [ServiceChargeController::class, 'store'])->name('service-charges.store');

Route::get('/payrolls', [PayrollController::class, 'index'])->name('payrolls.index');
Route::post('/payrolls', [PayrollController::class, 'store'])->name('payrolls.store');

Route::prefix('platforms')->name('platforms.')->group(function () {
    Route::get('/pos-app', fn () => Inertia::render('POSCashierView'))->name('pos-app');
    Route::get('/qr-order', fn () => Inertia::render('SelfOrderingQRView'))->name('qr-order');
    Route::get('/kiosk-order', fn () => Inertia::render('SelfOrderingKioskView'))->name('kiosk-order');
    Route::get('/kds-dapur', fn () => Inertia::render('KitchenDisplaySystemView'))->name('kds-dapur');
    Route::get('/queue-display', fn () => Inertia::render('QueueDisplayView'))->name('queue-display');
});