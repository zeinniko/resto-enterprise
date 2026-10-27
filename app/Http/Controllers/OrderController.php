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
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['branch', 'table', 'salesMode', 'shift.user', 'items.menuItem']);

        if ($request->search) {
            $query->where('order_number', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'branches' => Branch::where('is_active', true)->get(),
            'salesModes' => SalesMode::where('is_active', true)->get(),
            'tables' => Table::where('is_active', true)->get(),
            'menuItems' => MenuItem::where('is_active', true)->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'sales_mode_id' => 'required|exists:sales_modes,id',
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.qty' => 'required|integer|gt:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $activeShift = Shift::where('branch_id', $validated['branch_id'])
            ->where('status', 'OPEN')
            ->first();

        if (!$activeShift) {
            return redirect()->back()->withErrors(['message' => 'Tidak ada Shift Kasir aktif di cabang ini. Buka shift terlebih dahulu.']);
        }

        DB::transaction(function () use ($validated, $activeShift) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ($item['qty'] * $item['unit_price']);
            }

            $order = Order::create([
                'branch_id' => $validated['branch_id'],
                'shift_id' => $activeShift->id,
                'table_id' => $validated['table_id'] ?? null,
                'sales_mode_id' => $validated['sales_mode_id'],
                'order_number' => 'ORD-' . strtoupper(uniqid()),
                'status' => 'PENDING',
                'subtotal' => $subtotal,
                'tax' => $subtotal * 0.10, // Default PBN 10%
                'service_charge' => $subtotal * 0.05, // Default Service 5%
                'discount_amount' => 0,
                'final_total' => $subtotal + ($subtotal * 0.15),
                'payment_status' => 'UNPAID',
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'menu_item_id' => $item['menu_item_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['qty'] * $item['unit_price'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            if (!empty($validated['table_id'])) {
                Table::where('id', $validated['table_id'])->update(['status' => 'OCCUPIED']);
            }
        });

        return redirect()->back()->with('success', 'Order transaksi POS berhasil dibuat.');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:PENDING,COOKING,SERVED,COMPLETED,CANCELLED',
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->update(['status' => $validated['status']]);

            if (in_array($validated['status'], ['COMPLETED', 'CANCELLED']) && $order->table_id) {
                Table::where('id', $order->table_id)->update(['status' => 'AVAILABLE']);
            }
        });

        return redirect()->back()->with('success', 'Status order berhasil diperbarui.');
    }
}