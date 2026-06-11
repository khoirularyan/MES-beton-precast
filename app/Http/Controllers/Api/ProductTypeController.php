<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductType::query()->whereNull('deleted_at');
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
            'kode'        => 'required|string|max:20|unique:global.production_product_types,kode',
            'kategori'    => 'nullable|string|max:100',
            'nama'        => 'required|string|max:100',
            'kode_prefix' => 'nullable|string|max:10',
            'standar'     => 'nullable|string|max:100',
            'aktif'       => 'boolean',
        ]);
        return response()->json(ProductType::create($validated), 201);
    }

    public function show(ProductType $productType): JsonResponse
    {
        return response()->json($productType);
    }

    public function update(Request $request, ProductType $productType): JsonResponse
    {
        $validated = $request->validate([
            'kode'        => 'sometimes|string|max:20|unique:global.production_product_types,kode,' . $productType->id,
            'kategori'    => 'nullable|string|max:100',
            'nama'        => 'sometimes|string|max:100',
            'kode_prefix' => 'nullable|string|max:10',
            'standar'     => 'nullable|string|max:100',
            'aktif'       => 'boolean',
        ]);
        $productType->update($validated);
        return response()->json($productType->fresh());
    }

    public function destroy(ProductType $productType): JsonResponse
    {
        $productType->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
