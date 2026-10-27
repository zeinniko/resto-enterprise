<?php

namespace App\Http\Controllers;

use App\Models\CancelReason;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CancelReasonController extends Controller
{
    public function index(Request $request)
    {
        $reasons = CancelReason::latest()->paginate(10);
        return Inertia::render('CancelReasons/Index', ['reasons' => $reasons]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'requires_approval' => 'required|boolean',
        ]);

        CancelReason::create($validated);
        return redirect()->back()->with('success', 'Alasan void berhasil ditambahkan.');
    }
}