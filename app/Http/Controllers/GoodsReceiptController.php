<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\GoodsReceipt;
use App\Models\PurchaseOrder;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = GoodsReceipt::with(['branch', 'purchaseOrder.supplier', 'items.item', 'items.storageLocation', 'items.unit']);

        if ($request->search) {
            $query->where('receipt_number', 'like', "%{$request->search}%")
                  ->orWhereHas('purchaseOrder', fn($po) => $po->where('po_number', 'like', "%{$request->search}%"));
        }

        $goodsReceipts = $query->latest()->paginate(10)->withQueryString();

        // Ambil PO yang siap diterima (SUBMITTED / PARTIAL)
        $approvedPOs = PurchaseOrder::with(['items.item', 'items.unit', 'supplier'])
            ->whereIn('status', ['SUBMITTED', 'PARTIAL'])
            ->get();

        $storageLocations = StorageLocation::where('is_active', true)->get();

        return Inertia::render('GoodsReceipts/Index', [
            'goodsReceipts' => $goodsReceipts,
            'approvedPOs' => $approvedPOs,
            'storageLocations' => $storageLocations,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'receipt_number' => 'required|string|max:50|unique:goods_receipts,receipt_number',
            'received_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.storage_location_id' => 'required|exists:storage_locations,id',
            'items.*.qty_received' => 'required|numeric|gt:0',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.exp_date' => 'nullable|date',
            'items.*.batch_number' => 'required|string|max:50',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);

            $gr = GoodsReceipt::create([
                'branch_id' => $po->branch_id,
                'purchase_order_id' => $po->id,
                'receipt_number' => $validated['receipt_number'],
                'received_date' => $validated['received_date'],
                'received_by' => $request->user()?->id ?? 1,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $grItem = $gr->items()->create([
                    'item_id' => $item['item_id'],
                    'storage_location_id' => $item['storage_location_id'],
                    'qty_received' => $item['qty_received'],
                    'unit_id' => $item['unit_id'],
                    'unit_cost' => $item['unit_cost'],
                    'exp_date' => $item['exp_date'] ?? null,
                    'batch_number' => $item['batch_number'],
                ]);

                // Buat Batch Stok FEFO Otomatis
                $batch = StockBatch::create([
                    'branch_id' => $po->branch_id,
                    'storage_location_id' => $item['storage_location_id'],
                    'item_id' => $item['item_id'],
                    'goods_receipt_item_id' => $grItem->id,
                    'batch_number' => $item['batch_number'],
                    'initial_qty' => $item['qty_received'],
                    'current_qty' => $item['qty_received'],
                    'unit_id' => $item['unit_id'],
                    'unit_cost' => $item['unit_cost'],
                    'exp_date' => $item['exp_date'] ?? null,
                ]);

                // Record Pergerakan Stok Ledger
                StockMovement::create([
                    'branch_id' => $po->branch_id,
                    'item_id' => $item['item_id'],
                    'stock_batch_id' => $batch->id,
                    'to_location_id' => $item['storage_location_id'],
                    'movement_type' => 'IN_PURCHASE',
                    'qty' => $item['qty_received'],
                    'unit_id' => $item['unit_id'],
                    'created_by' => $request->user()?->id ?? 1,
                ]);
            }

            // Update status PO menjadi RECEIVED
            $po->update(['status' => 'RECEIVED']);
        });

        return redirect()->back()->with('success', 'Penerimaan barang berhasil diproses dan stok FEFO diperbarui.');
    }
}