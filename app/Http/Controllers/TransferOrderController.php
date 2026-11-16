<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\TransferOrder;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TransferOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = TransferOrder::with([
            'fromBranch:id,name,code',
            'toBranch:id,name,code',
            'requester:id,name',
            'shipper:id,name',
            'receiver:id,name',
            'items.item:id,name,sku',
            'items.unit:id,name,symbol',
        ]);

        if ($request->filled('search')) {
            $search =$request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transfer_number', 'like', "\%{$search}%")
                  ->orWhereHas('fromBranch', fn($b) => $b->where('name', 'like', "\%{$search}%"))
                  ->orWhereHas('toBranch', fn($b) => $b->where('name', 'like', "\%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status',$request->status);
        }

        $transferOrders =$query->latest()->paginate(10)->withQueryString();

        return Inertia::render('TransferOrders/Index', [
            'transferOrders'   => $transferOrders,
            'branches'         => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'storageLocations' => StorageLocation::where('is_active', true)->select('id', 'branch_id', 'name')->orderBy('name')->get(),
            'items'            => Item::with('primaryUnit:id,name,symbol')
                                      ->where('is_active', true)
                                      ->select('id', 'name', 'sku', 'primary_unit_id')
                                      ->orderBy('name')
                                      ->get(),
            'units'            => Unit::select('id', 'name', 'symbol')->orderBy('name')->get(),
            'filters'          => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'from_branch_id'        => 'required|exists:branches,id',
            'to_branch_id'          => 'required|exists:branches,id|different:from_branch_id',
            'transfer_number'       => 'required|string|max:50|unique:transfer_orders,transfer_number',
            'status'                => 'nullable|in:DRAFT,REQUESTED',
            'items'                 => 'required|array|min:1',
            'items.*.item_id'       => 'required|exists:items,id',
            'items.*.qty_requested' => 'required|numeric|gt:0',
            'items.*.unit_id'       => 'required|exists:units,id',
        ]);

        DB::transaction(function () use ($validated, $request) {$to = TransferOrder::create([
                'transfer_number' => $validated['transfer_number'],
                'from_branch_id'  => $validated['from_branch_id'],
                'to_branch_id'    => $validated['to_branch_id'],
                'status'          => $validated['status'] ?? 'DRAFT',
                'requested_by'    => $request->user()?->id,
            ]);

            foreach ($validated['items'] as $item) {$to->items()->create([
                    'item_id'       => $item['item_id'],
                    'qty_requested' => $item['qty_requested'],
                    'unit_id'       => $item['unit_id'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Transfer Order berhasil dibuat.');
    }

    public function update(Request $request, TransferOrder$transferOrder)
    {
        if (!in_array($transferOrder->status, ['DRAFT', 'REQUESTED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya Transfer Order berstatus DRAFT atau REQUESTED yang dapat diubah.',
            ]);
        }

        $validated =$request->validate([
            'from_branch_id'        => 'required|exists:branches,id',
            'to_branch_id'          => 'required|exists:branches,id|different:from_branch_id',
            'transfer_number'       => ['required', 'string', 'max:50', Rule::unique('transfer_orders', 'transfer_number')->ignore($transferOrder->id)],
            'status'                => 'nullable|in:DRAFT,REQUESTED',
            'items'                 => 'required|array|min:1',
            'items.*.item_id'       => 'required|exists:items,id',
            'items.*.qty_requested' => 'required|numeric|gt:0',
            'items.*.unit_id'       => 'required|exists:units,id',
        ]);

        DB::transaction(function () use ($validated, $transferOrder) {$transferOrder->update([
                'transfer_number' => $validated['transfer_number'],
                'from_branch_id'  => $validated['from_branch_id'],
                'to_branch_id'    => $validated['to_branch_id'],
                'status'          => $validated['status'] ?? $transferOrder->status,
            ]);

            $transferOrder->items()->delete();

            foreach ($validated['items'] as $item) {$transferOrder->items()->create([
                    'item_id'       => $item['item_id'],
                    'qty_requested' => $item['qty_requested'],
                    'unit_id'       => $item['unit_id'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Transfer Order berhasil diperbarui.');
    }

    public function ship(Request $request, TransferOrder$transferOrder)
    {
        if (!in_array($transferOrder->status, ['DRAFT', 'REQUESTED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya TO berstatus DRAFT atau REQUESTED yang dapat dikirim.',
            ]);
        }

        $transferOrder->load('items.item', 'items.unit');

        DB::transaction(function () use ($transferOrder,$request) {
            $userId =$request->user()?->id;

            foreach ($transferOrder->items as$toItem) {
                $neededQty = (float)$toItem->qty_requested;

                $batches = StockBatch::where('branch_id',$transferOrder->from_branch_id)
                    ->where('item_id', $toItem->item_id)
                    ->where('current_qty', '>', 0)
                    ->orderByRaw('exp_date IS NULL ASC')
                    ->orderBy('exp_date', 'asc')
                    ->orderBy('created_at', 'asc')
                    ->lockForUpdate()
                    ->get();

                $availableQty = (float)$batches->sum('current_qty');
                if ($availableQty < $neededQty) {$itemName = $toItem->item?->name ?? "Item #{$toItem->item_id}";
                    $symbol   =$toItem->unit?->symbol ?? '';
                    throw ValidationException::withMessages([
                        'message' => "Stok {$itemName} di cabang asal tidak mencukupi (Tersedia: {$availableQty} {$symbol}, Dibutuhkan: {$neededQty} {$symbol}).",
                    ]);
                }

                $toItem->update(['qty_shipped' =>$neededQty]);

                foreach ($batches as$batch) {
                    if ($neededQty <= 0) {
                        break;
                    }

                    $takeQty = min((float) $batch->current_qty,$neededQty);
                    $batch->decrement('current_qty',$takeQty);

                    StockMovement::create([
                        'branch_id'        => $transferOrder->from_branch_id,
                        'item_id'          => $toItem->item_id,
                        'stock_batch_id'   => $batch->id,
                        'from_location_id' => $batch->storage_location_id,
                        'movement_type'    => 'OUT_TRANSFER',
                        'qty'              => $takeQty,
                        'unit_id'          => $toItem->unit_id,
                        'created_by'       => $userId,
                    ]);

                    $neededQty -=$takeQty;
                }
            }

            $transferOrder->update([
                'status'     => 'IN_TRANSIT',
                'shipped_by' => $userId,
                'shipped_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Transfer Order dikirim (IN_TRANSIT) & stok cabang asal dipotong FEFO.');
    }

    public function receive(Request $request, TransferOrder$transferOrder)
    {
        if ($transferOrder->status !== 'IN_TRANSIT') {
            return redirect()->back()->withErrors([
                'message' => 'Hanya TO berstatus IN_TRANSIT yang dapat diterima.',
            ]);
        }

        $validated =$request->validate([
            'storage_location_id'  => 'required|exists:storage_locations,id',
            'items'                => 'required|array|min:1',
            'items.*.id'           => 'required|exists:transfer_order_items,id',
            'items.*.qty_received' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($transferOrder, $validated,$request) {
            $userId =$request->user()?->id;

            foreach ($validated['items'] as $itemData) {$toItem = $transferOrder->items()->findOrFail($itemData['id']);
                $qtyReceived = (float)$itemData['qty_received'];

                $toItem->update(['qty_received' =>$qtyReceived]);

                if ($qtyReceived > 0) {
                    // Ambil referensi harga modal (unit_cost) & exp_date dari mutasi keluar cabang asal
                    $outMovements = StockMovement::where('branch_id',$transferOrder->from_branch_id)
                        ->where('item_id', $toItem->item_id)
                        ->where('movement_type', 'OUT_TRANSFER')
                        ->when($transferOrder->shipped_at, fn($q) => $q->where('created_at', '>=',$transferOrder->shipped_at->copy()->subSeconds(5)))
                        ->get();

                    $sourceBatches = StockBatch::whereIn('id',$outMovements->pluck('stock_batch_id')->filter())->get()->keyBy('id');

                    $totalCost = 0;
                    $totalMovedQty = 0;
                    $earliestExp = null;

                    foreach ($outMovements as $mov) {$srcBatch = $sourceBatches->get($mov->stock_batch_id);
                        if ($srcBatch) {$totalCost += (float) $mov->qty * (float)$srcBatch->unit_cost;
                            $totalMovedQty += (float)$mov->qty;
                            if ($srcBatch->exp_date && (!$earliestExp || $srcBatch->exp_date <$earliestExp)) {
                                $earliestExp =$srcBatch->exp_date;
                            }
                        }
                    }

                    $unitCost =$totalMovedQty > 0
                        ? round($totalCost / $totalMovedQty, 2) : (float) (StockBatch::where('item_id',$toItem->item_id)->latest()->value('unit_cost') ?? 0);

                    $batch = StockBatch::create([
                        'branch_id'           => $transferOrder->to_branch_id,
                        'storage_location_id' => $validated['storage_location_id'],
                        'item_id'             => $toItem->item_id,
                        'batch_number'        => "TRF-{$transferOrder->transfer_number}",
                        'initial_qty'         => $qtyReceived,
                        'current_qty'         => $qtyReceived,
                        'unit_id'             => $toItem->unit_id,
                        'unit_cost'           => $unitCost,
                        'exp_date'            => $earliestExp,
                    ]);

                    StockMovement::create([
                        'branch_id'      => $transferOrder->to_branch_id,
                        'item_id'        => $toItem->item_id,
                        'stock_batch_id' => $batch->id,
                        'to_location_id' => $validated['storage_location_id'],
                        'movement_type'  => 'IN_TRANSFER',
                        'qty'            => $qtyReceived,
                        'unit_id'        => $toItem->unit_id,
                        'created_by'     => $userId,
                    ]);
                }
            }

            $transferOrder->update([
                'status'      => 'RECEIVED',
                'received_by' => $userId,
                'received_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Transfer Order diterima & stok cabang tujuan bertambah.');
    }

    public function cancel(TransferOrder $transferOrder)
    {
        if (!in_array($transferOrder->status, ['DRAFT', 'REQUESTED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya TO berstatus DRAFT atau REQUESTED yang dapat dibatalkan.',
            ]);
        }

        $transferOrder->update(['status' => 'CANCELLED']);

        return redirect()->back()->with('success', "Transfer Order {$transferOrder->transfer_number} dibatalkan.");
    }

    public function destroy(TransferOrder $transferOrder)
    {
        if (!in_array($transferOrder->status, ['DRAFT', 'CANCELLED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Hanya TO berstatus DRAFT atau CANCELLED yang dapat dihapus.',
            ]);
        }

        DB::transaction(function () use ($transferOrder) {
            $transferOrder->items()->delete();$transferOrder->delete();
        });

        return redirect()->back()->with('success', 'Transfer Order berhasil dihapus.');
    }
}