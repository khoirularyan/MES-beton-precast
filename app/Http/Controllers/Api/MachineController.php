<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Machine::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('tipe')) {
            $q->where('tipe', $request->tipe);
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'             => 'required|string|max:20|unique:production_machines,kode',
            'nama'             => 'required|string|max:100',
            'tipe'             => 'nullable|string|max:50',
            'line'             => 'nullable|string|max:50',
            'status'           => 'nullable|string|max:30',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date',
            'aktif'            => 'boolean',
        ]);
        return response()->json(Machine::create($validated), 201);
    }

    public function show(Machine $machine): JsonResponse
    {
        return response()->json($machine);
    }

    public function update(Request $request, Machine $machine): JsonResponse
    {
        $validated = $request->validate([
            'kode'             => 'sometimes|string|max:20|unique:production_machines,kode,' . $machine->id,
            'nama'             => 'sometimes|string|max:100',
            'tipe'             => 'nullable|string|max:50',
            'line'             => 'nullable|string|max:50',
            'status'           => 'nullable|string|max:30',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date',
            'aktif'            => 'boolean',
        ]);
        $machine->update($validated);
        return response()->json($machine->fresh());
    }

    public function destroy(Machine $machine): JsonResponse
    {
        $machine->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
