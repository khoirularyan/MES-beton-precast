<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BatchStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BatchStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = BatchStatus::query()->whereNull('deleted_at');
        
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('status', 'like', "%{$request->search}%");
            });
        }
        
        if ($request->has('aktif')) {
            $q->where('aktif', $request->boolean('aktif'));
        }

        return response()->json($q->orderBy('urutan')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:20|unique:global.production_batch_statuses,kode',
            'status'    => 'required|string|max:50',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);

        return response()->json(BatchStatus::create($validated), 201);
    }

    public function show(BatchStatus $batchStatus): JsonResponse
    {
        return response()->json($batchStatus);
    }

    public function update(Request $request, BatchStatus $batchStatus): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_batch_statuses,kode,' . $batchStatus->id,
            'status'    => 'sometimes|string|max:50',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);

        $batchStatus->update($validated);
        return response()->json($batchStatus->fresh());
    }

    public function destroy(BatchStatus $batchStatus): JsonResponse
    {
        $batchStatus->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
