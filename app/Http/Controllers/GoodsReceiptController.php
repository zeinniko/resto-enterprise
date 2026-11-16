<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
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
        $query = GoodsReceipt::with([
            'branch:id,name,code',
            'receiver:id,name',
            'purchaseOrder:id,po_number,supplier_id,status',
            'purchaseOrder.supplier:id,name,code',
            'items.item:id,name,sku',
            'items.storageLocation:id,name',
            'items.unit:id,name,symbol',
        ]);

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "\%{$search}%")
                  ->orWhereHas('purchaseOrder', fn($po) => $po->where('po_number', 'like', "\%{$search}%"))
                  ->orWhereHas('purchaseOrder.supplier', fn($s) => $s->where('name', 'like', "\%{$search}%"));
            });
        }

        $goodsReceipts =$query->latest()->paginate(10)->withQueryString();

        // Ambil PO berstatus ORDERED atau PARTIAL beserta sisa qty yang belum diterima
        $approvedPOs = PurchaseOrder::with([
            'branch:id,name,code',
            'supplier:id,name,code',
            'items.item:id,name,sku',
            'items.unit:id,name,symbol',
        ])
            ->whereIn('status', ['ORDERED', 'PARTIAL'])
            ->latest()
            ->get()
            ->map(function ($po) {
                $receivedMap = GoodsReceiptItem::whereHas('goodsReceipt', fn($q) => $q->where('purchase_order_id',$po->id))
                    ->select('item_id', DB::raw('SUM(qty_received) as total_received'))
                    ->groupBy('item_id')
                    ->pluck('total_received', 'item_id');

                $po->items->transform(function ($poItem) use ($receivedMap) {
                    $alreadyReceived = (float) ($receivedMap[$poItem->item_id] ?? 0);$remaining = max(0, (float) $poItem->qty_ordered -$alreadyReceived);
                    $poItem->qty_already_received =$alreadyReceived;
                    $poItem->qty_remaining =$remaining;
                    return $poItem;
                });

                return $po;
            });

        $storageLocations = StorageLocation::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('GoodsReceipts/Index', [
            'goodsReceipts'    => $goodsReceipts,
            'approvedPOs'      => $approvedPOs,
            'storageLocations' => $storageLocations,
            'filters'          => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'purchase_order_id'            => 'required|exists:purchase_orders,id',
            'receipt_number'               => 'required|string|max:50|unique:goods_receipts,receipt_number',
            'received_date'                => 'required|date',
            'notes'                        => 'nullable|string|max:500',
            'items'                        => 'required|array|min:1',
            'items.*.item_id'              => 'required|exists:items,id',
            'items.*.storage_location_id'  => 'required|exists:storage_locations,id',
            'items.*.qty_received'         => 'required|numeric|gt:0',
            'items.*.unit_id'              => 'required|exists:units,id',
            'items.*.unit_cost'            => 'required|numeric|min:0',
            'items.*.exp_date'             => 'nullable|date',
            'items.*.batch_number'         => 'required|string|max:50',
        ]);

        $po = PurchaseOrder::with('items')->findOrFail($validated['purchase_order_id']);

        if (!in_array($po->status, ['ORDERED', 'PARTIAL'])) {
            return redirect()->back()->withErrors([
                'message' => "PO {$po->po_number} berstatus {$po->status} dan tidak dapat diproses penerimaan.",
            ]);
        }

        DB::transaction(function () use ($validated, $request,$po) {
            $userId =$request->user()?->id;

            $gr = GoodsReceipt::create([
                'branch_id'         => $po->branch_id,
                'purchase_order_id' => $po->id,
                'receipt_number'    => $validated['receipt_number'],
                'received_date'     => $validated['received_date'],
                'received_by'       => $userId,
                'notes'             => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as$item) {
                $grItem =$gr->items()->create([
                    'item_id'             => $item['item_id'],
                    'storage_location_id' => $item['storage_location_id'],
                    'qty_received'        => $item['qty_received'],
                    'unit_id'             => $item['unit_id'],
                    'unit_cost'           => $item['unit_cost'],
                    'exp_date'            => $item['exp_date'] ?: null,
                    'batch_number'        => $item['batch_number'],
                ]);

                // 1. Buat Batch Stok FEFO Otomatis
                $batch = StockBatch::create([
                    'branch_id'             => $po->branch_id,
                    'storage_location_id'   => $item['storage_location_id'],
                    'item_id'               => $item['item_id'],
                    'goods_receipt_item_id' => $grItem->id,
                    'batch_number'          => $item['batch_number'],
                    'initial_qty'           => $item['qty_received'],
                    'current_qty'           => $item['qty_received'],
                    'unit_id'               => $item['unit_id'],
                    'unit_cost'             => $item['unit_cost'],
                    'exp_date'              => $item['exp_date'] ?: null,
                ]);

                // 2. Catat Pergerakan Stok ke Ledger
                StockMovement::create([
                    'branch_id'      => $po->branch_id,
                    'item_id'        => $item['item_id'],
                    'stock_batch_id' => $batch->id,
                    'to_location_id' => $item['storage_location_id'],
                    'movement_type'  => 'IN_PURCHASE',
                    'qty'            => $item['qty_received'],
                    'unit_id'        => $item['unit_id'],
                    'created_by'     => $userId,
                ]);
            }

            // 3. Evaluasi status PO: COMPLETED jika seluruh item terpenuhi, selain itu PARTIAL
            $totalReceivedByItem = GoodsReceiptItem::whereHas('goodsReceipt', fn($q) => $q->where('purchase_order_id',$po->id))
                ->select('item_id', DB::raw('SUM(qty_received) as total_received'))
                ->groupBy('item_id')
                ->pluck('total_received', 'item_id');

            $isFullyReceived = $po->items->every(function ($poItem) use ($totalReceivedByItem) {$received = (float) ($totalReceivedByItem[$poItem->item_id] ?? 0);
                return $received >= (float)$poItem->qty_ordered;
            });

            $po->update([
                'status' => $isFullyReceived ? 'COMPLETED' : 'PARTIAL',
            ]);
        });

        return redirect()->back()->with('success', 'Penerimaan barang berhasil diproses dan stok FEFO diperbarui.');
    }
}