<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query()->whereNull('deleted_at');

        if ($request->filled('search')) {
            $query->where('nama', 'ilike', "%{$request->search}%");
        }
        if ($request->filled('kota')) {
            $query->where('kota', $request->kota);
        }
        if ($request->has('aktif')) {
            $query->where('aktif', $request->boolean('aktif'));
        }

        $data = $query->with('materials')->orderBy('nama')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'     => 'required|string|max:200',
            'materials'=> 'nullable|array',
            'materials.*' => 'exists:global.production_materials,id',
            'kontak'   => 'nullable|string|max:30',
            'email'    => 'nullable|email|max:100',
            'alamat'   => 'nullable|string|max:300',
            'kota'     => 'nullable|string|max:100',
            'rating'   => 'nullable|integer|min:1|max:5',
            'aktif'    => 'boolean',
        ]);

        $supplier = Supplier::create($validated);
        if (isset($validated['materials'])) {
            $supplier->materials()->sync($validated['materials']);
        }
        return response()->json($supplier->load('materials'), 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load('materials'));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'nama'     => 'sometimes|string|max:200',
            'materials'=> 'nullable|array',
            'materials.*' => 'exists:global.production_materials,id',
            'kontak'   => 'nullable|string|max:30',
            'email'    => 'nullable|email|max:100',
            'alamat'   => 'nullable|string|max:300',
            'kota'     => 'nullable|string|max:100',
            'rating'   => 'nullable|integer|min:1|max:5',
            'aktif'    => 'boolean',
        ]);

        $supplier->update($validated);
        if (isset($validated['materials'])) {
            $supplier->materials()->sync($validated['materials']);
        }
        return response()->json($supplier->fresh('materials'));
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
