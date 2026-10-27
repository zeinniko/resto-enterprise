<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Floor;
use App\Models\Table;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FloorTableController extends Controller
{
    public function index(Request $request)
    {
        $query = Floor::with(['branch', 'tables']);

        if ($request->branch_id) {
            $query->where('branch_id',$request->branch_id);
        }

        $floors = $query->latest()->paginate(10)->withQueryString();$branches = Branch::where('is_active', true)->select('id', 'name', 'code')->get();

        return Inertia::render('FloorsTables/Index', [
            'floors' => $floors,
            'branches' => $branches,
            'filters' => $request->only(['branch_id']),
        ]);
    }

    public function storeFloor(Request $request)
    {
        $validated =$request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        Floor::create($validated);

        return redirect()->back()->with('success', 'Lantai/Denah berhasil ditambahkan.');
    }

    public function storeTable(Request $request)
    {
        $validated =$request->validate([
            'floor_id' => 'required|exists:floors,id',
            'table_number' => 'required|string|max:30',
            'capacity' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ]);

        Table::create($validated + ['status' => 'AVAILABLE']);

        return redirect()->back()->with('success', 'Meja berhasil ditambahkan.');
    }

    public function updateTableStatus(Request $request, Table$table)
    {
        $validated =$request->validate([
            'status' => 'required|in:AVAILABLE,OCCUPIED,RESERVED',
        ]);

        $table->update(['status' =>$validated['status']]);

        return redirect()->back()->with('success', 'Status meja berhasil diperbarui.');
    }
}