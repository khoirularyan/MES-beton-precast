<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mold;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MoldController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Mold::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:global.production_molds,kode',
            'nama'      => 'required|string|max:100',
            'produk'    => 'nullable|string|max:100',
            'jumlah'    => 'nullable|integer|min:0',
            'aktif'     => 'nullable|integer|min:0',
            'kondisi'   => 'nullable|string|max:30',
            'utilisasi' => 'nullable|integer|min:0|max:100',
        ]);
        return response()->json(Mold::create($validated), 201);
    }

    public function show(Mold $mold): JsonResponse
    {
        return response()->json($mold);
    }

    public function update(Request $request, Mold $mold): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_molds,kode,' . $mold->id,
            'nama'      => 'sometimes|string|max:100',
            'produk'    => 'nullable|string|max:100',
            'jumlah'    => 'nullable|integer|min:0',
            'aktif'     => 'nullable|integer|min:0',
            'kondisi'   => 'nullable|string|max:30',
            'utilisasi' => 'nullable|integer|min:0|max:100',
        ]);
        $mold->update($validated);
        return response()->json($mold->fresh());
    }

    public function destroy(Mold $mold): JsonResponse
    {
        $mold->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
