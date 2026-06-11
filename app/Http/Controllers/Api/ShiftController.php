<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Shift::with('supervisor')->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'           => 'required|string|max:20|unique:global.production_shifts,kode',
            'nama'           => 'required|string|max:50',
            'jam'            => 'nullable|string|max:30',
            'supervisor_id'  => 'nullable|exists:global.users,id',
            'jumlah_pekerja' => 'nullable|integer|min:0',
            'aktif'          => 'boolean',
        ]);
        return response()->json(Shift::create($validated), 201);
    }

    public function show(Shift $shift): JsonResponse
    {
        return response()->json($shift);
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'kode'           => 'sometimes|string|max:20|unique:global.production_shifts,kode,' . $shift->id,
            'nama'           => 'sometimes|string|max:50',
            'jam'            => 'nullable|string|max:30',
            'supervisor_id'  => 'nullable|exists:global.users,id',
            'jumlah_pekerja' => 'nullable|integer|min:0',
            'aktif'          => 'boolean',
        ]);
        $shift->update($validated);
        return response()->json($shift->fresh());
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $shift->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
