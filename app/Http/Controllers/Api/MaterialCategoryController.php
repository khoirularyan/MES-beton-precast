<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = MaterialCategory::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:production_material_categories,kode',
            'nama'      => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'contoh'    => 'nullable|string|max:300',
            'aktif'     => 'boolean',
        ]);
        return response()->json(MaterialCategory::create($validated), 201);
    }

    public function show(MaterialCategory $materialCategory): JsonResponse
    {
        return response()->json($materialCategory);
    }

    public function update(Request $request, MaterialCategory $materialCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:production_material_categories,kode,' . $materialCategory->id,
            'nama'      => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'contoh'    => 'nullable|string|max:300',
            'aktif'     => 'boolean',
        ]);
        $materialCategory->update($validated);
        return response()->json($materialCategory->fresh());
    }

    public function destroy(MaterialCategory $materialCategory): JsonResponse
    {
        $materialCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
