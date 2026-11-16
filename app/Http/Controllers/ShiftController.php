<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with([
            'branch:id,name,code',
            'user:id,name',
        ])->withCount('orders');

        if ($request->filled('branch_id')) {
            $query->where('branch_id',$request->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status',$request->status);
        }

        $shifts =$query->orderByRaw("CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END")
            ->orderByDesc('opened_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Shift $shift) {
                if ($shift->status === 'OPEN') {$calc = $this->calculateExpectedCash($shift);
                    $shift->setAttribute('live_cash_sales',$calc['cash_sales']);
                    $shift->setAttribute('live_petty_cash',$calc['petty_cash_net']);
                    $shift->setAttribute('live_expected_cash',$calc['expected_cash']);
                }
                return $shift;
            });

        return Inertia::render('Shifts/Index', [
            'shifts'   => $shifts,
            'branches' => Branch::where('is_active', true)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get(),
            'filters'  => $request->only(['branch_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'     => 'required|exists:branches,id',
            'starting_cash' => 'required|numeric|min:0',
            'notes'         => 'nullable|string|max:500',
        ]);

        $userId =$request->user()?->id ?? 1;

        // Pastikan tidak ada shift berstatus OPEN untuk kasir ini di cabang tersebut
        $activeShift = Shift::where('branch_id',$validated['branch_id'])
            ->where('user_id', $userId)
            ->where('status', 'OPEN')
            ->first();

        if ($activeShift) {
            return redirect()->back()->withErrors([
                'message' => 'Anda masih memiliki register shift kasir yang berstatus OPEN di cabang ini.',
            ]);
        }

        Shift::create([
            'branch_id'     => $validated['branch_id'],
            'user_id'       => $userId,
            'opened_at'     => now(),
            'starting_cash' => $validated['starting_cash'],
            'status'        => 'OPEN',
            'notes'         => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Shift kasir baru berhasil dibuka.');
    }

    public function close(Request $request, Shift$shift)
    {
        if ($shift->status === 'CLOSED') {
            return redirect()->back()->withErrors([
                'message' => 'Register shift kasir ini sudah ditutup sebelumnya.',
            ]);
        }

        $validated =$request->validate([
            'ending_cash_actual' => 'required|numeric|min:0',
            'notes'              => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($shift,$validated) {
            $calc         =$this->calculateExpectedCash($shift);$expectedCash = $calc['expected_cash'];$actualCash   = round((float) $validated['ending_cash_actual'], 2);$variance     = round($actualCash -$expectedCash, 2);

            $combinedNotes = collect([$shift->notes,$validated['notes'] ?? null])
                ->filter()
                ->implode(' | ');

            $shift->update([
                'closed_at'            => now(),
                'ending_cash_expected' => $expectedCash,
                'ending_cash_actual'   => $actualCash,
                'variance'             => $variance,
                'status'               => 'CLOSED',
                'notes'                => $combinedNotes ?: null,
            ]);
        });

        return redirect()->back()->with('success', 'Shift kasir berhasil ditutup & selisih kas telah direkonsiliasi.');
    }

    /**
     * Menghitung ekspektasi kas fisik di laci: Modal Awal + Penjualan Tunai (CASH) ± Petty Cash
     */
    private function calculateExpectedCash(Shift $shift): array
    {
        $startingCash = (float)$shift->starting_cash;
        $cashSales    = 0.0;

        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'order_id')) {
            $paymentQuery = DB::table('payments')
                ->join('orders', 'payments.order_id', '=', 'orders.id')
                ->where('orders.shift_id', $shift->id);

            if (Schema::hasColumn('payments', 'payment_method')) {
                $paymentQuery->where('payments.payment_method', 'CASH');
            } elseif (Schema::hasColumn('payments', 'method')) {
                $paymentQuery->where('payments.method', 'CASH');
            }

            if (Schema::hasColumn('payments', 'status')) {
                $paymentQuery->whereIn('payments.status', ['PAID', 'SETTLED', 'SUCCESS']);
            }

            $amountCol = Schema::hasColumn('payments', 'amount') ? 'payments.amount' : 'orders.grand_total';$cashSales = (float) $paymentQuery->sum($amountCol);
        } elseif (Schema::hasTable('orders')) {
            $orderQuery =$shift->orders();

            if (Schema::hasColumn('orders', 'payment_method')) {
                $orderQuery->where('payment_method', 'CASH');
            }

            if (Schema::hasColumn('orders', 'payment_status')) {
                $orderQuery->where('payment_status', 'PAID');
            } elseif (Schema::hasColumn('orders', 'status')) {
                $orderQuery->whereIn('status', ['PAID', 'COMPLETED']);
            }

            $totalCol  = Schema::hasColumn('orders', 'grand_total') ? 'grand_total' : 'total_amount';$cashSales = (float) $orderQuery->sum($totalCol);
        }

        $pettyCashNet = 0.0;
        if (Schema::hasTable('petty_cashes')) {
            $pcQuery =$shift->pettyCashes();

            if (Schema::hasColumn('petty_cashes', 'status')) {
                $pcQuery->where('status', 'APPROVED');
            }

            if (Schema::hasColumn('petty_cashes', 'type')) {
                $pcIn         = (float) (clone $pcQuery)->where('type', 'IN')->sum('amount');$pcOut        = (float) (clone $pcQuery)->whereIn('type', ['OUT', 'EXPENSE'])->sum('amount');$pettyCashNet = $pcIn -$pcOut;
            } else {
                $pettyCashNet = -1 * (float)$pcQuery->sum('amount');
            }
        }

        return [
            'starting_cash'  => $startingCash,
            'cash_sales'     => round($cashSales, 2),
            'petty_cash_net' => round($pettyCashNet, 2), 'expected_cash'  => round($startingCash + $cashSales +$pettyCashNet, 2),
        ];
    }
}