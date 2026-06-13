<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductionStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductionStatus::query();
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('status', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('urutan')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:20|unique:production_statuses,kode',
            'status'    => 'required|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductionStatus::create($validated), 201);
    }

    public function show(ProductionStatus $productionStatus): JsonResponse
    {
        return response()->json($productionStatus);
    }

    public function update(Request $request, ProductionStatus $productionStatus): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:production_statuses,kode,' . $productionStatus->id,
            'status'    => 'sometimes|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        $productionStatus->update($validated);
        return response()->json($productionStatus->fresh());
    }

    public function destroy(ProductionStatus $productionStatus): JsonResponse
    {
        $productionStatus->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
