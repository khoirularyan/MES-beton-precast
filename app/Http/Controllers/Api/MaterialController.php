<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Material::with('supplier')->whereNull('deleted_at');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kode', 'ilike', "%{$request->search}%")
                  ->orWhere('nama', 'ilike', "%{$request->search}%");
            });
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }
        if ($request->boolean('low_stock')) {
            $query->whereRaw('stok <= min_stok');
        }

        return response()->json($query->orderBy('kode')->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'          => 'required|string|max:20|unique:production_materials,kode',
            'nama'          => 'required|string|max:200',
            'satuan'        => 'nullable|string|max:20',
            'kategori'      => 'nullable|string|max:50',
            'stok'          => 'nullable|numeric|min:0',
            'min_stok'      => 'nullable|numeric|min:0',
            'supplier_id'   => 'nullable|exists:production_suppliers,id',
            'harga'         => 'nullable|integer|min:0',
            'lead_time_hari' => 'nullable|integer|min:0',
            'aktif'         => 'boolean',
        ]);

        return response()->json(Material::create($validated), 201);
    }

    public function show(Material $material): JsonResponse
    {
        return response()->json($material->load('supplier'));
    }

    public function update(Request $request, Material $material): JsonResponse
    {
        $validated = $request->validate([
            'nama'          => 'sometimes|string|max:200',
            'satuan'        => 'nullable|string|max:20',
            'kategori'      => 'nullable|string|max:50',
            'stok'          => 'nullable|numeric|min:0',
            'min_stok'      => 'nullable|numeric|min:0',
            'supplier_id'   => 'nullable|exists:production_suppliers,id',
            'harga'         => 'nullable|integer|min:0',
            'lead_time_hari' => 'nullable|integer|min:0',
            'aktif'         => 'boolean',
        ]);

        $material->update($validated);
        return response()->json($material->fresh('supplier'));
    }

    public function destroy(Material $material): JsonResponse
    {
        $material->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
