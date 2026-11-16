<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\PettyCash;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class PettyCashController extends Controller
{
    public function index(Request $request)
    {
        $relations = [
            'branch:id,name,code',
            'creator:id,name',
        ];

        if (Schema::hasColumn('petty_cashes', 'shift_id')) {
            $relations[] = 'shift:id,opened_at,status';
        }

        $baseQuery = PettyCash::query();

        if ($request->filled('branch_id')) {
            $baseQuery->where('branch_id',$request->branch_id);
        }

        if ($request->filled('type')) {
            $baseQuery->where('type',$request->type);
        }

        if ($request->filled('category') && Schema::hasColumn('petty_cashes', 'category')) {
            $baseQuery->where('category',$request->category);
        }

        if ($request->filled('start_date')) {
            $baseQuery->whereDate('created_at', '>=',$request->start_date);
        }

        if ($request->filled('end_date')) {
            $baseQuery->whereDate('created_at', '<=',$request->end_date);
        }

        if ($request->filled('search')) {
            $search =$request->search;
            $baseQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "\%{$search}%");
                if (Schema::hasColumn('petty_cashes', 'category')) {
                    $q->orWhere('category', 'like', "\%{$search}%");
                }
            });
        }

        // Ringkasan saldo sesuai filter cabang & periode
        $summaryQuery = PettyCash::query()
            ->when($request->filled('branch_id'), fn($q) => $q->where('branch_id',$request->branch_id))
            ->when($request->filled('start_date'), fn($q) => $q->whereDate('created_at', '>=',$request->start_date))
            ->when($request->filled('end_date'), fn($q) => $q->whereDate('created_at', '<=',$request->end_date));

        $totalIn  = (float) (clone$summaryQuery)->where('type', 'IN')->sum('amount');
        $totalOut = (float) (clone$summaryQuery)->where('type', 'OUT')->sum('amount');

        $records = (clone$baseQuery)
            ->with($relations)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // Daftar shift kasir yang sedang OPEN per cabang untuk opsi sinkronisasi laci kasir
        $openShifts = Shift::with('user:id,name')
            ->where('status', 'OPEN')
            ->select('id', 'branch_id', 'user_id', 'opened_at', 'status')
            ->latest('opened_at')
            ->get();

        return Inertia::render('PettyCash/Index', [
            'records'    => $records,
            'branches'   => Branch::where('is_active', true)->select('id', 'name', 'code')->orderBy('name')->get(),
            'openShifts' => $openShifts,
            'summary'    => [
                'total_in'  => round($totalIn, 2),
                'total_out' => round($totalOut, 2), 'balance'   => round($totalIn - $totalOut, 2), ], 'filters'    =>$request->only(['search', 'branch_id', 'type', 'category', 'start_date', 'end_date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated =$request->validate([
            'branch_id'        => 'required|exists:branches,id',
            'type'             => 'required|in:IN,OUT',
            'category'         => 'required|string|max:100',
            'amount'           => 'required|numeric|min:100',
            'description'      => 'required|string|max:255',
            'link_active_shift'=> 'nullable|boolean',
        ]);

        $userId  =$request->user()?->id;
        $shiftId = null;

        if (($validated['link_active_shift'] ?? true) && Schema::hasColumn('petty_cashes', 'shift_id')) {
            $activeShift = Shift::where('branch_id',$validated['branch_id'])
                ->where('status', 'OPEN')
                ->when($userId, fn($q) =>$q->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$userId]))
                ->latest('opened_at')
                ->first();

            $shiftId =$activeShift?->id;
        }

        $payload = [
            'branch_id'   => $validated['branch_id'],
            'type'        => $validated['type'],
            'amount'      => round((float) $validated['amount'], 2), 'description' =>$validated['description'],
        ];

        if (Schema::hasColumn('petty_cashes', 'category')) {
            $payload['category'] =$validated['category'];
        }

        if (Schema::hasColumn('petty_cashes', 'shift_id')) {
            $payload['shift_id'] =$shiftId;
        }

        if (Schema::hasColumn('petty_cashes', 'created_by')) {
            $payload['created_by'] =$userId;
        }

        PettyCash::create($payload);

        return redirect()->back()->with('success', 'Transaksi kas kecil berhasil dicatat.');
    }

    public function destroy(PettyCash $pettyCash)
    {
        if ($pettyCash->shift_id &&$pettyCash->shift?->status === 'CLOSED') {
            return redirect()->back()->withErrors([
                'message' => 'Transaksi kas kecil yang sudah masuk ke shift kasir CLOSED tidak dapat dihapus.',
            ]);
        }

        $pettyCash->delete();

        return redirect()->back()->with('success', 'Catatan transaksi kas kecil berhasil dihapus.');
    }
}