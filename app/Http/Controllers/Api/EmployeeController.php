<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Employee::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('nik', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('departemen')) {
            $q->where('departemen', $request->departemen);
        }
        if ($request->filled('shift')) {
            $q->where('shift', $request->shift);
        }
        return response()->json($q->orderBy('nik')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nik'        => 'required|string|max:20|unique:global.production_employees,nik',
            'nama'       => 'required|string|max:200',
            'jabatan'    => 'nullable|string|max:100',
            'departemen' => 'nullable|string|max:50',
            'shift'      => 'nullable|string|max:20',
            'status'     => 'nullable|string|max:30',
            'aktif'      => 'boolean',
        ]);
        return response()->json(Employee::create($validated), 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json($employee);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate([
            'nik'        => 'sometimes|string|max:20|unique:global.production_employees,nik,' . $employee->id,
            'nama'       => 'sometimes|string|max:200',
            'jabatan'    => 'nullable|string|max:100',
            'departemen' => 'nullable|string|max:50',
            'shift'      => 'nullable|string|max:20',
            'status'     => 'nullable|string|max:30',
            'aktif'      => 'boolean',
        ]);
        $employee->update($validated);
        return response()->json($employee->fresh());
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
