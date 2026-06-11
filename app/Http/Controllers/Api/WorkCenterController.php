<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkCenterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkCenter::query();

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'                   => 'required|string|max:30|unique:global.production_work_centers,code',
            'name'                   => 'required|string|max:100',
            'description'            => 'nullable|string|max:255',
            'capacity_qty_per_shift' => 'nullable|numeric|min:0',
            'capacity_m3_per_shift'  => 'nullable|numeric|min:0',
            'shifts_per_day'         => 'nullable|integer|min:1|max:3',
            'is_active'              => 'boolean',
        ]);

        return response()->json(WorkCenter::create($validated), 201);
    }

    public function show(WorkCenter $workCenter): JsonResponse
    {
        return response()->json($workCenter);
    }

    public function update(Request $request, WorkCenter $workCenter): JsonResponse
    {
        $validated = $request->validate([
            'name'                   => 'sometimes|string|max:100',
            'description'            => 'nullable|string|max:255',
            'capacity_qty_per_shift' => 'nullable|numeric|min:0',
            'capacity_m3_per_shift'  => 'nullable|numeric|min:0',
            'shifts_per_day'         => 'nullable|integer|min:1|max:3',
            'is_active'              => 'boolean',
        ]);

        $workCenter->update($validated);
        return response()->json($workCenter->fresh());
    }

    public function destroy(WorkCenter $workCenter): JsonResponse
    {
        $workCenter->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
