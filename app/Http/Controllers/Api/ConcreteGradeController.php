<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConcreteGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConcreteGradeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ConcreteGrade::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where('grade', 'like', "%{$request->search}%");
        }
        return response()->json($q->orderBy('grade')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'grade'     => 'required|string|max:20|unique:global.production_concrete_grades,grade',
            'fc'        => 'nullable|numeric|min:0',
            'slump'     => 'nullable|string|max:20',
            'semen'     => 'nullable|numeric|min:0',
            'agregat'   => 'nullable|numeric|min:0',
            'air'       => 'nullable|numeric|min:0',
            'admixture' => 'nullable|string|max:100',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ConcreteGrade::create($validated), 201);
    }

    public function show(ConcreteGrade $concreteGrade): JsonResponse
    {
        return response()->json($concreteGrade);
    }

    public function update(Request $request, ConcreteGrade $concreteGrade): JsonResponse
    {
        $validated = $request->validate([
            'grade'     => 'sometimes|string|max:20|unique:global.production_concrete_grades,grade,' . $concreteGrade->id,
            'fc'        => 'nullable|numeric|min:0',
            'slump'     => 'nullable|string|max:20',
            'semen'     => 'nullable|numeric|min:0',
            'agregat'   => 'nullable|numeric|min:0',
            'air'       => 'nullable|numeric|min:0',
            'admixture' => 'nullable|string|max:100',
            'aktif'     => 'boolean',
        ]);
        $concreteGrade->update($validated);
        return response()->json($concreteGrade->fresh());
    }

    public function destroy(ConcreteGrade $concreteGrade): JsonResponse
    {
        $concreteGrade->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
