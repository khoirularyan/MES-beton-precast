<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QcParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QcParameterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = QcParameter::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('parameter', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:30|unique:global.production_qc_parameters,kode',
            'parameter' => 'required|string|max:200',
            'satuan'    => 'nullable|string|max:30',
            'min'       => 'nullable|string|max:30',
            'target'    => 'nullable|string|max:30',
            'metode'    => 'nullable|string|max:100',
            'aktif'     => 'boolean',
        ]);
        return response()->json(QcParameter::create($validated), 201);
    }

    public function show(QcParameter $qcParameter): JsonResponse
    {
        return response()->json($qcParameter);
    }

    public function update(Request $request, QcParameter $qcParameter): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:30|unique:global.production_qc_parameters,kode,' . $qcParameter->id,
            'parameter' => 'sometimes|string|max:200',
            'satuan'    => 'nullable|string|max:30',
            'min'       => 'nullable|string|max:30',
            'target'    => 'nullable|string|max:30',
            'metode'    => 'nullable|string|max:100',
            'aktif'     => 'boolean',
        ]);
        $qcParameter->update($validated);
        return response()->json($qcParameter->fresh());
    }

    public function destroy(QcParameter $qcParameter): JsonResponse
    {
        $qcParameter->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
