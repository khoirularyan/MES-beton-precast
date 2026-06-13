<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Warehouse::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('tipe')) {
            $q->where('tipe', $request->tipe);
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:20|unique:production_warehouses,kode',
            'nama'      => 'required|string|max:100',
            'tipe'      => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:200',
            'kapasitas' => 'nullable|string|max:50',
            'utilisasi' => 'nullable|integer|min:0|max:100',
            'aktif'     => 'boolean',
        ]);
        return response()->json(Warehouse::create($validated), 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:production_warehouses,kode,' . $warehouse->id,
            'nama'      => 'sometimes|string|max:100',
            'tipe'      => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:200',
            'kapasitas' => 'nullable|string|max:50',
            'utilisasi' => 'nullable|integer|min:0|max:100',
            'aktif'     => 'boolean',
        ]);
        $warehouse->update($validated);
        return response()->json($warehouse->fresh());
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $warehouse->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
