<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\SalesMode;
use App\Models\Shift;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $relations = [
            'branch:id,name,code',
            'table:id,branch_id,table_number,status',
            'shift:id,branch_id,user_id,status',
            'user:id,name',
            'items.menuItem:id,name,sku,selling_price',
        ];

        $hasSalesModeColumn = Schema::hasColumn('orders', 'sales_mode_id');
        if ($hasSalesModeColumn) {
            $relations[] = 'salesMode:id,name,code';
        }

        if (Schema::hasTable('payments')) {
            $relations[] = 'payments';
        }

        $query = Order::with($relations);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('table', fn($t) => $t->where('table_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        $orders = $query->latest()->paginate(10)->withQueryString();

        $salesModes = Schema::hasTable('sales_modes')
            ? SalesMode::where('is_active', true)->get()
            : collect([]);

        // Daftar cabang yang sedang memiliki shift kasir OPEN
        $openShiftBranchIds = Shift::where('status', 'OPEN')
            ->pluck('branch_id')
            ->unique()
            ->values();

        return Inertia::render('Orders/Index', [
            'orders'             => $orders,
            'branches'           => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'salesModes'         => $salesModes,
            'tables'             => Table::where('is_active', true)->select('id', 'branch_id', 'table_number', 'status')->orderBy('table_number')->get(),
            'menuItems'          => MenuItem::where('is_active', true)->select('id', 'name', 'sku', 'selling_price')->orderBy('name')->get(),
            'openShiftBranchIds' => $openShiftBranchIds,
            'filters'            => $request->only(['search', 'status', 'branch_id', 'order_type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id'            => 'required|exists:branches,id',
            'order_type'           => 'required|in:DINE_IN,TAKE_AWAY,DELIVERY_AGGREGATOR',
            'sales_mode_id'        => 'nullable|integer',
            'table_id'             => 'nullable|exists:tables,id',
            'discount_amount'      => 'nullable|numeric|min:0',
            'apply_tax'            => 'nullable|boolean',
            'apply_service'        => 'nullable|boolean',
            'items'                => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.qty'          => 'required|integer|min:1',
            'items.*.unit_price'   => 'required|numeric|min:0',
            'items.*.notes'        => 'nullable|string|max:255',
        ]);

        if ($validated['order_type'] === 'DINE_IN' && empty($validated['table_id'])) {
            return redirect()->back()->withErrors([
                'table_id' => 'Pilih meja terlebih dahulu untuk transaksi Dine-In.',
            ]);
        }

        // Prioritaskan shift OPEN milik user login di cabang tersebut, fallback ke shift OPEN aktif cabang
        $userId = $request->user()?->id;
        $activeShift = Shift::where('branch_id', $validated['branch_id'])
            ->where('status', 'OPEN')
            ->when($userId, fn($q) => $q->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$userId]))
            ->latest('opened_at')
            ->first();

        if (!$activeShift) {
            return redirect()->back()->withErrors([
                'message' => 'Tidak ada Shift Kasir berstatus OPEN di cabang ini. Buka shift kasir terlebih dahulu.',
            ]);
        }

        DB::transaction(function () use ($validated, $activeShift, $userId) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ((int) $item['qty'] * (float) $item['unit_price']);
            }

            $discountAmount      = min((float) ($validated['discount_amount'] ?? 0), $subtotal);
            $netSubtotal         = max(0, $subtotal - $discountAmount);
            $applyService        = $validated['apply_service'] ?? true;
            $applyTax            = $validated['apply_tax'] ?? true;
            $serviceChargeAmount = $applyService ? round($netSubtotal * 0.05, 2) : 0;
            $taxAmount           = $applyTax ? round(($netSubtotal + $serviceChargeAmount) * 0.10, 2) : 0;
            $grandTotal          = round($netSubtotal + $serviceChargeAmount + $taxAmount, 2);

            $orderPayload = [
                'branch_id'             => $validated['branch_id'],
                'shift_id'              => $activeShift->id,
                'table_id'              => $validated['order_type'] === 'DINE_IN' ? ($validated['table_id'] ?? null) : null,
                'order_number'          => 'ORD-' . now()->format('ymd') . '-' . strtoupper(substr(uniqid(), -5)),
                'order_type'            => $validated['order_type'],
                'status'                => 'PENDING',
                'subtotal'              => round($subtotal, 2),
                'discount_amount'       => round($discountAmount, 2),
                'tax_amount'            => $taxAmount,
                'service_charge_amount' => $serviceChargeAmount,
                'grand_total'           => $grandTotal,
                'user_id'               => $userId ?? $activeShift->user_id ?? 1,
            ];

            if (!empty($validated['sales_mode_id']) && Schema::hasColumn('orders', 'sales_mode_id')) {
                $orderPayload['sales_mode_id'] = $validated['sales_mode_id'];
            }

            $order = Order::create($orderPayload);

            $hasItemStatus = Schema::hasColumn('order_items', 'status');

            foreach ($validated['items'] as $item) {
                $itemPayload = [
                    'menu_item_id' => $item['menu_item_id'],
                    'qty'          => (int) $item['qty'],
                    'unit_price'   => (float) $item['unit_price'],
                    'subtotal'     => round((int) $item['qty'] * (float) $item['unit_price'], 2),
                    'notes'        => $item['notes'] ?? null,
                ];

                if ($hasItemStatus) {
                    $itemPayload['status'] = 'PENDING';
                }

                $order->items()->create($itemPayload);
            }

            if (!empty($orderPayload['table_id'])) {
                Table::where('id', $orderPayload['table_id'])->update(['status' => 'OCCUPIED']);
            }
        });

        return redirect()->back()->with('success', 'Order transaksi POS berhasil dibuat & dikirim ke antrean dapur.');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status'         => 'required|in:PENDING,IN_KITCHEN,SERVED,PAID,CANCELLED',
            'payment_method' => 'nullable|in:CASH,QRIS,DEBIT_CARD,CREDIT_CARD,TRANSFER,E_WALLET',
            'amount_paid'    => 'nullable|numeric|min:0',
        ]);

        if (in_array($order->status, ['PAID', 'CANCELLED'])) {
            return redirect()->back()->withErrors([
                'message' => 'Order yang sudah PAID atau CANCELLED tidak dapat diubah statusnya.',
            ]);
        }

        DB::transaction(function () use ($order, $validated, $request) {
            $order->update(['status' => $validated['status']]);

            // Catat pembayaran ke tabel payments saat order dilunasi (PAID)
            if ($validated['status'] === 'PAID' && Schema::hasTable('payments')) {
                $paymentColumns = Schema::getColumnListing('payments');
                $paymentData    = [
                    'order_id'   => $order->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $method = $validated['payment_method'] ?? 'CASH';
                if (in_array('payment_method', $paymentColumns)) {
                    $paymentData['payment_method'] = $method;
                } elseif (in_array('method', $paymentColumns)) {
                    $paymentData['method'] = $method;
                }

                if (in_array('amount', $paymentColumns)) {
                    $paymentData['amount'] = (float) $order->grand_total;
                }
                if (in_array('amount_tendered', $paymentColumns)) {
                    $paymentData['amount_tendered'] = (float) ($validated['amount_paid'] ?? $order->grand_total);
                }
                if (in_array('change_amount', $paymentColumns)) {
                    $paid = (float) ($validated['amount_paid'] ?? $order->grand_total);
                    $paymentData['change_amount'] = max(0, round($paid - (float) $order->grand_total, 2));
                }
                if (in_array('status', $paymentColumns)) {
                    $paymentData['status'] = 'PAID';
                }
                if (in_array('paid_at', $paymentColumns)) {
                    $paymentData['paid_at'] = now();
                }
                if (in_array('user_id', $paymentColumns)) {
                    $paymentData['user_id'] = $request->user()?->id ?? $order->user_id;
                }

                DB::table('payments')->insert($paymentData);
            }

            // Kosongkan meja jika order selesai (PAID) atau dibatalkan (CANCELLED) dan tidak ada order aktif lain di meja tsb
            if (in_array($validated['status'], ['PAID', 'CANCELLED']) && $order->table_id) {
                $hasOtherActiveOrder = Order::where('table_id', $order->table_id)
                    ->where('id', '!=', $order->id)
                    ->whereNotIn('status', ['PAID', 'CANCELLED'])
                    ->exists();

                if (!$hasOtherActiveOrder) {
                    Table::where('id', $order->table_id)->update(['status' => 'AVAILABLE']);
                }
            }
        });

        return redirect()->back()->with('success', "Status order {$order->order_number} diperbarui menjadi {$validated['status']}.");
    }
}