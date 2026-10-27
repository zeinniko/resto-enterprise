<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Station;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StationController extends Controller
{
    public function index(Request $request)
    {
        $query = Station::with('branch');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $stations = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Stations/Index', [
            'stations' => $stations,
            'branches' => Branch::where('is_active', true)->select('id', 'name', 'code')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:100',
            'printer_ip' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        Station::create($validated);

        return redirect()->back()->with('success', 'Station Dapur berhasil ditambahkan.');
    }

    public function update(Request $request, Station $station)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:100',
            'printer_ip' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $station->update($validated);

        return redirect()->back()->with('success', 'Station Dapur berhasil diperbarui.');
    }

    public function destroy(Station $station)
    {
        $station->delete();
        return redirect()->back()->with('success', 'Station Dapur berhasil dihapus.');
    }
}