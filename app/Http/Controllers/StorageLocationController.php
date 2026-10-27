<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StorageLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = StorageLocation::with('branch');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $storageLocations = $query->latest()->paginate(10)->withQueryString();
        $branches = Branch::select('id', 'name', 'code')->get();

        return Inertia::render('StorageLocations/Index', [
            'storageLocations' => $storageLocations,
            'branches' => $branches,
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:DRY,CHILLER,FREEZER',
            'is_active' => 'required|boolean',
        ]);

        StorageLocation::create($validated);

        return redirect()->back()->with('success', 'Lokasi penyimpanan berhasil ditambahkan.');
    }

    public function update(Request $request, StorageLocation $storageLocation)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:DRY,CHILLER,FREEZER',
            'is_active' => 'required|boolean',
        ]);

        $storageLocation->update($validated);

        return redirect()->back()->with('success', 'Lokasi penyimpanan berhasil diperbarui.');
    }

    public function destroy(StorageLocation $storageLocation)
    {
        if ($storageLocation->stockBatches()->where('current_qty', '>', 0)->exists()) {
            return redirect()->back()->withErrors(['message' => 'Lokasi penyimpanan tidak dapat dihapus karena masih menampung stok aktif.']);
        }

        $storageLocation->delete();

        return redirect()->back()->with('success', 'Lokasi penyimpanan berhasil dihapus.');
    }
}