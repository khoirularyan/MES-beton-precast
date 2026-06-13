<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductCategory::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:production_product_categories,kode',
            'nama'      => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductCategory::create($validated), 201);
    }

    public function show(ProductCategory $productCategory): JsonResponse
    {
        return response()->json($productCategory);
    }

    public function update(Request $request, ProductCategory $productCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:production_product_categories,kode,' . $productCategory->id,
            'nama'      => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        $productCategory->update($validated);
        return response()->json($productCategory->fresh());
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $productCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
