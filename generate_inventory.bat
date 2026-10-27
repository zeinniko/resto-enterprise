@echo off
echo Generating Models and Migrations for Resto Enterprise System...

:: 1. Core & Multi-Branch
php artisan make:model Branch -m
php artisan make:model BranchUser -m

:: 2. Master Inventaris & Pemasok
php artisan make:model Category -m
php artisan make:model Unit -m
php artisan make:model UnitConversion -m
php artisan make:model Item -m
php artisan make:model BranchItem -m
php artisan make:model Supplier -m
php artisan make:model StorageLocation -m

:: 3. Menu & Resep (Bill of Materials)
php artisan make:model MenuItem -m
php artisan make:model Recipe -m
php artisan make:model RecipeItem -m

:: 4. Procurement (Pengadaan)
php artisan make:model PurchaseOrder -m
php artisan make:model PurchaseOrderItem -m
php artisan make:model GoodsReceipt -m
php artisan make:model GoodsReceiptItem -m

:: 5. Mutasi Antar Cabang & Produksi (Central Kitchen)
php artisan make:model TransferOrder -m
php artisan make:model TransferOrderItem -m
php artisan make:model ProductionOrder -m
php artisan make:model ProductionOrderItem -m

:: 6. Manajemen Stok & Audit FEFO
php artisan make:model StockBatch -m
php artisan make:model StockMovement -m
php artisan make:model WasteLog -m
php artisan make:model StockCount -m
php artisan make:model StockCountDetail -m

:: 7. POS & Front-of-House
php artisan make:model Floor -m
php artisan make:model Table -m
php artisan make:model Shift -m
php artisan make:model Discount -m
php artisan make:model Order -m
php artisan make:model OrderItem -m
php artisan make:model Payment -m

:: 8. Finance & Akuntansi
php artisan make:model ChartOfAccount -m
php artisan make:model Journal -m
php artisan make:model JournalEntry -m
php artisan make:model AccountsPayable -m
php artisan make:model AccountsReceivable -m
php artisan make:model PettyCash -m

:: 9. HRIS & Payroll
php artisan make:model Employee -m
php artisan make:model WorkShift -m
php artisan make:model Attendance -m
php artisan make:model Payroll -m
php artisan make:model ServiceChargeAllocation -m

:: 10. Tambahan
php artisan make:model Station -m
php artisan make:model MenuExtra -m
php artisan make:model SalesMode -m
php artisan make:model CancelReason -m
php artisan make:model MenuPackage -m
php artisan make:model MenuPackageItem -m
php artisan make:model Brand -m
php artisan make:model CostCenter -m
php artisan make:model MembershipType -m

echo.
echo All Enterprise Models and Migrations Generated Successfully!
pause