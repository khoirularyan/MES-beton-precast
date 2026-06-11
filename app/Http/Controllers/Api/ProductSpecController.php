<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductSpec;
use App\Models\Product;
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
                   ->orWhere('produk', 'like', "%{$request->search}%")
                   ->orWhereHas('product', function ($pq) use ($request) {
                       $pq->where('nama', 'like', "%{$request->search}%");
                   });
            });
        }
        
        // Filter by product_id if provided
        if ($request->filled('product_id')) {
            $q->where('product_id', $request->product_id);
        }
        
        return response()->json(
            $q->with('product')
              ->orderBy('kode')
              ->paginate($request->get('per_page', 100))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:global.production_products,id',
            'kode'       => 'required|string|max:30|unique:global.production_product_specs,kode',
            'dimensi'    => 'nullable|string|max:100',
            'toleransi'  => 'nullable|string|max:50',
            'berat'      => 'nullable|string|max:50',
            'grade'      => 'nullable|string|max:20',
            'aktif'      => 'boolean',
        ]);
        
        $product = Product::find($validated['product_id']);
        $validated['produk'] = $product ? $product->nama : '';
        
        $spec = ProductSpec::create($validated);
        
        return response()->json($spec->load('product'), 201);
    }

    public function show(ProductSpec $productSpec): JsonResponse
    {
        return response()->json($productSpec->load('product'));
    }

    public function update(Request $request, ProductSpec $productSpec): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'sometimes|required|exists:global.production_products,id',
            'kode'       => 'sometimes|string|max:30|unique:global.production_product_specs,kode,' . $productSpec->id,
            'dimensi'    => 'nullable|string|max:100',
            'toleransi'  => 'nullable|string|max:50',
            'berat'      => 'nullable|string|max:50',
            'grade'      => 'nullable|string|max:20',
            'aktif'      => 'boolean',
        ]);
        
        if (!empty($validated['product_id'])) {
            $product = Product::find($validated['product_id']);
            $validated['produk'] = $product ? $product->nama : '';
        }
        
        $productSpec->update($validated);
        
        return response()->json($productSpec->fresh('product'));
    }

    public function destroy(ProductSpec $productSpec): JsonResponse
    {
        $productSpec->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
