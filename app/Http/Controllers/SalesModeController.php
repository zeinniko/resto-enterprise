<?php
namespace App\Http\Controllers;

use App\Models\SalesMode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesModeController extends Controller
{
    public function index(Request $request)
    {
        $salesModes = SalesMode::when($request->search, function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('code', 'like', "%{$request->search}%");
        })->latest()->paginate(10)->withQueryString();

        return Inertia::render('SalesModes/Index', [
            'salesModes' => $salesModes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:sales_modes,code',
            'name' => 'required|string|max:255',
            'markup_percentage' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        SalesMode::create($validated);

        return redirect()->back()->with('success', 'Mode Penjualan berhasil ditambahkan.');
    }

    public function update(Request $request, SalesMode $salesMode)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:sales_modes,code,' . $salesMode->id,
            'name' => 'required|string|max:255',
            'markup_percentage' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $salesMode->update($validated);

        return redirect()->back()->with('success', 'Mode Penjualan berhasil diperbarui.');
    }

    public function destroy(SalesMode $salesMode)
    {
        $salesMode->delete();
        return redirect()->back()->with('success', 'Mode Penjualan berhasil dihapus.');
    }
}