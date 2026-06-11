<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductSpec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductSpecController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductSpec::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('produk', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:30|unique:global.production_product_specs,kode',
            'produk'    => 'required|string|max:200',
            'dimensi'   => 'nullable|string|max:100',
            'toleransi' => 'nullable|string|max:50',
            'berat'     => 'nullable|string|max:50',
            'grade'     => 'nullable|string|max:20',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductSpec::create($validated), 201);
    }

    public function show(ProductSpec $productSpec): JsonResponse
    {
        return response()->json($productSpec);
    }

    public function update(Request $request, ProductSpec $productSpec): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:30|unique:global.production_product_specs,kode,' . $productSpec->id,
            'produk'    => 'sometimes|string|max:200',
            'dimensi'   => 'nullable|string|max:100',
            'toleransi' => 'nullable|string|max:50',
            'berat'     => 'nullable|string|max:50',
            'grade'     => 'nullable|string|max:20',
            'aktif'     => 'boolean',
        ]);
        $productSpec->update($validated);
        return response()->json($productSpec->fresh());
    }

    public function destroy(ProductSpec $productSpec): JsonResponse
    {
        $productSpec->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
