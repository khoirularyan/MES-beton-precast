<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = DeliveryStatus::query();
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('status', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('urutan')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:20|unique:global.production_delivery_statuses,kode',
            'status'    => 'required|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        return response()->json(DeliveryStatus::create($validated), 201);
    }

    public function show(DeliveryStatus $deliveryStatus): JsonResponse
    {
        return response()->json($deliveryStatus);
    }

    public function update(Request $request, DeliveryStatus $deliveryStatus): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_delivery_statuses,kode,' . $deliveryStatus->id,
            'status'    => 'sometimes|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        $deliveryStatus->update($validated);
        return response()->json($deliveryStatus->fresh());
    }

    public function destroy(DeliveryStatus $deliveryStatus): JsonResponse
    {
        $deliveryStatus->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
