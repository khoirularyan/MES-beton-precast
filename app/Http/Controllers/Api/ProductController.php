<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->whereNull('deleted_at');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kode', 'ilike', "%{$request->search}%")
                  ->orWhere('nama', 'ilike', "%{$request->search}%");
            });
        }
        if ($request->boolean('active_only')) {
            $query->where('aktif', true);
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        $data = $query->orderBy('kode')->paginate($request->get('per_page', 20));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'     => 'required|string|max:30|unique:global.production_products,kode',
            'nama'     => 'required|string|max:200',
            'kategori' => 'nullable|string|max:50',
            'varian'   => 'nullable|string|max:50',
            'spek'     => 'nullable|string|max:100',
            'grade'    => 'nullable|string|max:20',
            'berat'    => 'nullable|numeric|min:0',
            'harga'    => 'nullable|integer|min:0',
            'satuan'   => 'nullable|string|max:20',
            'standar'  => 'nullable|string|max:50',
            'aktif'    => 'boolean',
        ]);

        if (!empty($validated['kategori'])) {
            ProductCategory::firstOrCreate(['nama' => $validated['kategori']]);
        }
        if (!empty($validated['varian'])) {
            ProductType::firstOrCreate(['nama' => $validated['varian']]);
        }

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['bomHeaders.items.material']));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'nama'     => 'sometimes|string|max:200',
            'kategori' => 'nullable|string|max:50',
            'varian'   => 'nullable|string|max:50',
            'spek'     => 'nullable|string|max:100',
            'grade'    => 'nullable|string|max:20',
            'berat'    => 'nullable|numeric|min:0',
            'harga'    => 'nullable|integer|min:0',
            'satuan'   => 'nullable|string|max:20',
            'standar'  => 'nullable|string|max:50',
            'aktif'    => 'boolean',
        ]);

        if (!empty($validated['kategori'])) {
            ProductCategory::firstOrCreate(['nama' => $validated['kategori']]);
        }
        if (!empty($validated['varian'])) {
            ProductType::firstOrCreate(['nama' => $validated['varian']]);
        }

        $product->update($validated);
        return response()->json($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
