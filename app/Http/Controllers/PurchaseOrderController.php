<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['branch', 'supplier', 'items.item', 'items.unit']);

        if ($request->search) {$query->where(function ($q) use ($request) {
                $q->where('po_number', 'like', "\%{$request->search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "\%{$request->search}%"));
            });
        }

        if ($request->status) {
            $query->where('status',$request->status);
        }

        $purchaseOrders =$query->latest()->paginate(10)->withQueryString();

        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'branches' => Branch::select('id', 'name', 'code')->get(),
            'suppliers' => Supplier::select('id', 'name', 'code')->get(),
            'items' => Item::with('purchaseUnit')->where('is_active', true)->select('id', 'name', 'sku', 'purchase_unit_id')->get(),
            'units' => Unit::select('id', 'name', 'symbol')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id' => 'required|exists:branches,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'po_number' => 'required|string|max:50|unique:purchase_orders,po_number',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.qty_ordered' => 'required|numeric|gt:0',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {$totalAmount = 0;
            foreach ($validated['items'] as $item) {$totalAmount += $item['qty_ordered'] *$item['unit_price'];
            }

            $po = PurchaseOrder::create([
                'branch_id' => $validated['branch_id'],
                'supplier_id' => $validated['supplier_id'],
                'po_number' => $validated['po_number'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'status' => 'DRAFT',
                'total_amount' => $totalAmount,
                'created_by' => $request->user()?->id ?? 1,
            ]);

            foreach ($validated['items'] as$item) {
                $subtotal =$item['qty_ordered'] * $item['unit_price'];$po->items()->create([
                    'item_id' => $item['item_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_id' => $item['unit_id'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $subtotal,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Purchase Order berhasil dibuat.');
    }

    public function updateStatus(Request $request, PurchaseOrder$purchaseOrder)
    {
        $validated =$request->validate([
            'status' => 'required|in:DRAFT,SUBMITTED,CANCELLED',
        ]);

        $purchaseOrder->update(['status' =>$validated['status']]);

        return redirect()->back()->with('success', 'Status Purchase Order diperbarui.');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->goodsReceipts()->exists()) {
            return redirect()->back()->withErrors(['message' => 'PO tidak dapat dihapus karena sudah memiliki penerimaan barang.']);
        }

        DB::transaction(function () use ($purchaseOrder) {
            $purchaseOrder->items()->delete();$purchaseOrder->delete();
        });

        return redirect()->back()->with('success', 'Purchase Order berhasil dihapus.');
    }
}