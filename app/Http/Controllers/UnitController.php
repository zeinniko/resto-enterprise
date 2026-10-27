<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UnitConversion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $units = Unit::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('symbol', 'like', "%{$request->search}%");
        })->latest()->paginate(10)->withQueryString();

        $conversions = UnitConversion::with(['fromUnit', 'toUnit'])->get();

        return Inertia::render('Units/Index', [
            'units' => $units,
            'allUnits' => Unit::select('id', 'name', 'symbol')->get(),
            'conversions' => $conversions,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
        ]);

        Unit::create($validated);

        return redirect()->back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
        ]);

        $unit->update($validated);

        return redirect()->back()->with('success', 'Satuan berhasil diperbarui.');
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();

        return redirect()->back()->with('success', 'Satuan berhasil dihapus.');
    }

    public function storeConversion(Request $request)
    {
        $validated = $request->validate([
            'from_unit_id' => 'required|exists:units,id|different:to_unit_id',
            'to_unit_id' => 'required|exists:units,id',
            'conversion_factor' => 'required|numeric|gt:0',
        ]);

        UnitConversion::updateOrCreate(
            [
                'from_unit_id' => $validated['from_unit_id'],
                'to_unit_id' => $validated['to_unit_id'],
            ],
            ['conversion_factor' => $validated['conversion_factor']]
        );

        return redirect()->back()->with('success', 'Konversi satuan berhasil disimpan.');
    }

    public function destroyConversion(UnitConversion $conversion)
    {
        $conversion->delete();

        return redirect()->back()->with('success', 'Konversi satuan berhasil dihapus.');
    }
}