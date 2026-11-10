<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Floor;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FloorTableController extends Controller
{
    public function index(Request $request)
    {
        $query = Floor::with(['branch', 'tables']);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $floors = $query->latest()->paginate(10)->withQueryString();
        $branches = Branch::where('is_active', true)->select('id', 'name', 'code')->get();

        return Inertia::render('FloorsTables/Index', [
            'floors' => $floors,
            'branches' => $branches,
            'filters' => $request->only(['branch_id']),
        ]);
    }

    public function storeFloor(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
        ]);

        Floor::create($validated);

        return redirect()->back()->with('success', 'Lantai/Denah area berhasil ditambahkan.');
    }

    public function storeTable(Request $request)
    {
        $validated = $request->validate([
            'floor_id' => 'required|exists:floors,id',
            'number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('tables')->where(fn ($q) => $q->where('floor_id', $request->floor_id)),
            ],
            'capacity' => 'required|integer|min:1',
        ], [
            'number.unique' => 'Nomor meja ini sudah terdaftar pada lantai/area yang dipilih.',
        ]);

        Table::create($validated + ['status' => 'AVAILABLE']);

        return redirect()->back()->with('success', 'Meja baru berhasil ditambahkan.');
    }

    public function updateTableStatus(Request $request, Table $table)
    {
        $validated = $request->validate([
            'status' => 'required|in:AVAILABLE,OCCUPIED,RESERVED,CLEANING',
        ]);

        $table->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Status meja berhasil diperbarui.');
    }

    public function destroyFloor(Floor $floor)
    {
        $floor->tables()->delete();
        $floor->delete();

        return redirect()->back()->with('success', 'Area lantai dan meja di dalamnya berhasil dihapus.');
    }

    public function destroyTable(Table $table)
    {
        $table->delete();

        return redirect()->back()->with('success', 'Meja berhasil dihapus.');
    }
}