<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ServiceChargeAllocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ServiceChargeController extends Controller
{
    public function index(Request $request)
    {
        $records = ServiceChargeAllocation::with('branch')
            ->when($request->search, function ($q) use ($request) {
                $q->whereHas('branch', function ($bQ) use ($request) {
                    $bQ->where('name', 'like', "%{$request->search}%")
                       ->orWhere('code', 'like', "%{$request->search}%");
                })->orWhere('period', 'like', "%{$request->search}%");
            })
            ->when($request->period, function ($q) use ($request) {
                $q->where('period', $request->period);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $branches = Branch::where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('ServiceCharges/Index', [
            'records' => $records,
            'branches' => $branches,
            'filters' => $request->only(['search', 'period']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'period' => [
                'required',
                'string',
                'max:7',
                Rule::unique('service_charge_allocations')->where(function ($query) use ($request) {
                    return $query->where('branch_id', $request->branch_id);
                }),
            ],
            'total_collected' => 'required|numeric|min:0',
            'allocated_percentage' => 'required|numeric|min:0|max:100',
            'status' => 'required|in:DRAFT,DISTRIBUTED',
        ], [
            'period.unique' => 'Alokasi Service Charge untuk cabang & periode ini sudah terdaftar.',
            'total_collected.required' => 'Total pengumpulan service charge wajib diisi.',
        ]);

        // Kalkulasi nilai alokasi yang dibagikan ke staf
        $validated['total_amount_allocated'] = $validated['total_collected'] * ($validated['allocated_percentage'] / 100);

        ServiceChargeAllocation::create($validated);

        return redirect()->back()->with('success', 'Alokasi service charge berhasil dicatat.');
    }

    public function update(Request $request, ServiceChargeAllocation $serviceCharge)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'period' => [
                'required',
                'string',
                'max:7',
                Rule::unique('service_charge_allocations')
                    ->where(fn ($query) => $query->where('branch_id', $request->branch_id))
                    ->ignore($serviceCharge->id),
            ],
            'total_collected' => 'required|numeric|min:0',
            'allocated_percentage' => 'required|numeric|min:0|max:100',
            'status' => 'required|in:DRAFT,DISTRIBUTED',
        ], [
            'period.unique' => 'Alokasi Service Charge untuk cabang & periode ini sudah terdaftar.',
        ]);

        $validated['total_amount_allocated'] = $validated['total_collected'] * ($validated['allocated_percentage'] / 100);

        $serviceCharge->update($validated);

        return redirect()->back()->with('success', 'Alokasi service charge berhasil diperbarui.');
    }

    public function destroy(ServiceChargeAllocation $serviceCharge)
    {
        $serviceCharge->delete();

        return redirect()->back()->with('success', 'Alokasi service charge berhasil dihapus.');
    }
}