<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DefectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DefectCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = DefectCategory::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('tingkat')) {
            $q->where('tingkat', $request->tingkat);
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'          => 'required|string|max:20|unique:global.production_defect_categories,kode',
            'nama'          => 'required|string|max:100',
            'warna'         => 'nullable|string|max:10',
            'tingkat'       => 'nullable|in:Kritis,Mayor,Minor',
            'penyebab_umum' => 'nullable|string|max:300',
            'disposisi'     => 'nullable|string|max:200',
            'aktif'         => 'boolean',
        ]);
        return response()->json(DefectCategory::create($validated), 201);
    }

    public function show(DefectCategory $defectCategory): JsonResponse
    {
        return response()->json($defectCategory);
    }

    public function update(Request $request, DefectCategory $defectCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'          => 'sometimes|string|max:20|unique:global.production_defect_categories,kode,' . $defectCategory->id,
            'nama'          => 'sometimes|string|max:100',
            'warna'         => 'nullable|string|max:10',
            'tingkat'       => 'nullable|in:Kritis,Mayor,Minor',
            'penyebab_umum' => 'nullable|string|max:300',
            'disposisi'     => 'nullable|string|max:200',
            'aktif'         => 'boolean',
        ]);
        $defectCategory->update($validated);
        return response()->json($defectCategory->fresh());
    }

    public function destroy(DefectCategory $defectCategory): JsonResponse
    {
        $defectCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
