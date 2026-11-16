<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with([
            'branch:id,name,code',
            'supplier:id,name,code',
            'creator:id,name',
            'items.item:id,name,sku',
            'items.unit:id,name,symbol',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', fn($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $purchaseOrders = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'branches'       => Branch::select('id', 'name', 'code')->orderBy('name')->get(),
            'suppliers'      => Supplier::select('id', 'name', 'code')->orderBy('name')->get(),
            'items'          => Item::with('purchaseUnit:id,name,symbol')
                                    ->where('is_active', true)
                                    ->select('id', 'name', 'sku', 'purchase_unit_id')
                                    ->orderBy('name')
                                    ->get(),
            'units'          => Unit::select('id', 'name', 'symbol')->orderBy('name')->get(),
            'filters'        => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id'              => 'required|exists:branches,id',
            'supplier_id'            => 'required|exists:suppliers,id',
            'po_number'              => 'required|string|max:50|unique:purchase_orders,po_number',
            'order_date'             => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'items'                  => 'required|array|min:1',
            'items.*.item_id'        => 'required|exists:items,id',
            'items.*.qty_ordered'    => 'required|numeric|gt:0',
            'items.*.unit_id'        => 'required|exists:units,id',
            'items.*.unit_price'     => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $totalAmount = collect($validated['items'])->sum(
                fn($item) => (float) $item['qty_ordered'] * (float) $item['unit_price']
            );

            $po = PurchaseOrder::create([
                'branch_id'              => $validated['branch_id'],
                'supplier_id'            => $validated['supplier_id'],
                'po_number'              => $validated['po_number'],
                'order_date'             => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status'                 => 'DRAFT',
                'total_amount'           => $totalAmount,
                'created_by'             => $request->user()?->id,
            ]);

            foreach ($validated['items'] as $item) {
                $po->items()->create([
                    'item_id'     => $item['item_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_id'     => $item['unit_id'],
                    'unit_price'  => $item['unit_price'],
                    'subtotal'    => (float) $item['qty_ordered'] * (float) $item['unit_price'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Purchase Order berhasil dibuat.');
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'DRAFT') {
            return redirect()->back()->withErrors([
                'message' => 'Hanya Purchase Order berstatus DRAFT yang dapat diubah.',
            ]);
        }

        $validated = $request->validate([
            'branch_id'              => 'required|exists:branches,id',
            'supplier_id'            => 'required|exists:suppliers,id',
            'po_number'              => ['required', 'string', 'max:50', Rule::unique('purchase_orders', 'po_number')->ignore($purchaseOrder->id)],
            'order_date'             => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'items'                  => 'required|array|min:1',
            'items.*.item_id'        => 'required|exists:items,id',
            'items.*.qty_ordered'    => 'required|numeric|gt:0',
            'items.*.unit_id'        => 'required|exists:units,id',
            'items.*.unit_price'     => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $totalAmount = collect($validated['items'])->sum(
                fn($item) => (float) $item['qty_ordered'] * (float) $item['unit_price']
            );

            $purchaseOrder->update([
                'branch_id'              => $validated['branch_id'],
                'supplier_id'            => $validated['supplier_id'],
                'po_number'              => $validated['po_number'],
                'order_date'             => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'total_amount'           => $totalAmount,
            ]);

            $purchaseOrder->items()->delete();

            foreach ($validated['items'] as $item) {
                $purchaseOrder->items()->create([
                    'item_id'     => $item['item_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_id'     => $item['unit_id'],
                    'unit_price'  => $item['unit_price'],
                    'subtotal'    => (float) $item['qty_ordered'] * (float) $item['unit_price'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Purchase Order berhasil diperbarui.');
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'status' => 'required|in:ORDERED,CANCELLED',
        ]);

        $newStatus = $validated['status'];

        if ($newStatus === 'ORDERED' && $purchaseOrder->status !== 'DRAFT') {
            return redirect()->back()->withErrors(['message' => 'Hanya PO DRAFT yang dapat dikirim menjadi ORDERED.']);
        }

        if ($newStatus === 'CANCELLED') {
            if (!in_array($purchaseOrder->status, ['DRAFT', 'ORDERED'])) {
                return redirect()->back()->withErrors(['message' => 'PO yang sudah diproses penerimaan tidak dapat dibatalkan.']);
            }
            if ($purchaseOrder->goodsReceipts()->exists()) {
                return redirect()->back()->withErrors(['message' => 'PO sudah memiliki dokumen penerimaan barang (GR).']);
            }
        }

        $purchaseOrder->update(['status' => $newStatus]);

        return redirect()->back()->with('success', "Status PO {$purchaseOrder->po_number} diubah menjadi {$newStatus}.");
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['DRAFT', 'CANCELLED']) || $purchaseOrder->goodsReceipts()->exists()) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya PO berstatus DRAFT atau CANCELLED tanpa penerimaan barang yang dapat dihapus.',
            ]);
        }

        DB::transaction(function () use ($purchaseOrder) {
            $purchaseOrder->items()->delete();
            $purchaseOrder->delete();
        });

        return redirect()->back()->with('success', 'Purchase Order berhasil dihapus.');
    }
}