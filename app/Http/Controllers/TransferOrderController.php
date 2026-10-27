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
use Inertia\Inertia;

class TransferOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = TransferOrder::with([
            'fromBranch', 
            'toBranch', 
            'items.item', 
            'items.unit',
            'requester'
        ]);

        if ($request->search) {
            $query->where('transfer_number', 'like', "\%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status',$request->status);
        }

        $transferOrders =$query->latest()->paginate(10)->withQueryString();

        return Inertia::render('TransferOrders/Index', [
            'transferOrders' => $transferOrders,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'items' => Item::with('primaryUnit')->where('is_active', true)->select('id', 'name', 'sku', 'primary_unit_id')->get(),
            'units' => Unit::select('id', 'name', 'symbol')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'transfer_number' => 'required|string|max:50|unique:transfer_orders,transfer_number',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.qty_requested' => 'required|numeric|gt:0',
            'items.*.unit_id' => 'required|exists:units,id',
        ]);

        DB::transaction(function () use ($validated, $request) {$to = TransferOrder::create([
                'transfer_number' => $validated['transfer_number'],
                'from_branch_id' => $validated['from_branch_id'],
                'to_branch_id' => $validated['to_branch_id'],
                'status' => 'DRAFT',
                'requested_by' => $request->user()?->id ?? 1,
            ]);

            foreach ($validated['items'] as $item) {$to->items()->create([
                    'item_id' => $item['item_id'],
                    'qty_requested' => $item['qty_requested'],
                    'unit_id' => $item['unit_id'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pengajuan Transfer Order berhasil disimpan.');
    }

    public function ship(Request $request, TransferOrder$transferOrder)
    {
        if ($transferOrder->status !== 'DRAFT') {
            return redirect()->back()->withErrors(['message' => 'Hanya TO berstatus DRAFT yang dapat dikirim.']);
        }

        DB::transaction(function () use ($transferOrder, $request) {$transferOrder->update([
                'status' => 'SHIPPED',
                'shipped_by' => $request->user()?->id ?? 1,
                'shipped_at' => now(),
            ]);

            foreach ($transferOrder->items as$toItem) {
                $toItem->update(['qty_shipped' =>$toItem->qty_requested]);

                // Potong stok cabang asal berbasis FEFO
                $neededQty =$toItem->qty_shipped;
                $batches = StockBatch::where('branch_id',$transferOrder->from_branch_id)
                    ->where('item_id', $toItem->item_id)
                    ->where('current_qty', '>', 0)
                    ->orderBy('exp_date', 'asc')
                    ->orderBy('created_at', 'asc')
                    ->get();

                foreach ($batches as$batch) {
                    if ($neededQty <= 0) break;

                    $takeQty = min($batch->current_qty,$neededQty);
                    $batch->decrement('current_qty',$takeQty);

                    StockMovement::create([
                        'branch_id' => $transferOrder->from_branch_id,
                        'item_id' => $toItem->item_id,
                        'stock_batch_id' => $batch->id,
                        'from_location_id' => $batch->storage_location_id,
                        'movement_type' => 'OUT_TRANSFER',
                        'qty' => $takeQty,
                        'unit_id' => $toItem->unit_id,
                        'created_by' => $request->user()?->id ?? 1,
                    ]);

                    $neededQty -=$takeQty;
                }
            }
        });

        return redirect()->back()->with('success', 'Transfer Order berhasil dikirim & stok cabang asal telah dipotong FEFO.');
    }

    public function receive(Request $request, TransferOrder$transferOrder)
    {
        if ($transferOrder->status !== 'SHIPPED') {
            return redirect()->back()->withErrors(['message' => 'Hanya TO berstatus SHIPPED yang dapat diterima.']);
        }

        $validated =$request->validate([
            'storage_location_id' => 'required|exists:storage_locations,id',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:transfer_order_items,id',
            'items.*.qty_received' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($transferOrder,$validated, $request) {$transferOrder->update([
                'status' => 'RECEIVED',
                'received_by' => $request->user()?->id ?? 1,
                'received_at' => now(),
            ]);

            foreach ($validated['items'] as $itemData) {$toItem = $transferOrder->items()->findOrFail($itemData['id']);
                $toItem->update(['qty_received' =>$itemData['qty_received']]);

                if ($itemData['qty_received'] > 0) { // Buat Batch Stok Baru di Cabang Tujuan
                    $batch = StockBatch::create([
                        'branch_id' => $transferOrder->to_branch_id,
                        'storage_location_id' => $validated['storage_location_id'],
                        'item_id' => $toItem->item_id,
                        'batch_number' => "TRF-{$transferOrder->transfer_number}",
                        'initial_qty' => $itemData['qty_received'],
                        'current_qty' => $itemData['qty_received'],
                        'unit_id' => $toItem->unit_id,
                        'unit_cost' => 0,
                    ]);

                    StockMovement::create([
                        'branch_id' => $transferOrder->to_branch_id,
                        'item_id' => $toItem->item_id,
                        'stock_batch_id' => $batch->id,
                        'to_location_id' => $validated['storage_location_id'],
                        'movement_type' => 'IN_TRANSFER',
                        'qty' => $itemData['qty_received'],
                        'unit_id' => $toItem->unit_id,
                        'created_by' => $request->user()?->id ?? 1,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Transfer Order berhasil diterima & stok cabang tujuan telah bertambah.');
    }
}