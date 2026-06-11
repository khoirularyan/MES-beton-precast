<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()->whereNull('deleted_at');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kode', 'like', "%{$request->search}%")
                  ->orWhere('nama', 'like', "%{$request->search}%")
                  ->orWhere('kontak', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('segmen')) {
            $query->where('segmen', $request->segmen);
        }
        if ($request->filled('kota')) {
            $query->where('kota', $request->kota);
        }
        if ($request->has('aktif')) {
            $query->where('aktif', $request->boolean('aktif'));
        }

        $data = $query->orderBy('kode')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'         => 'required|string|max:20|unique:production_customers,kode',
            'nama'         => 'required|string|max:200',
            'kontak'       => 'nullable|string|max:100',
            'telepon'      => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:100',
            'npwp'         => 'nullable|string|max:20',
            'pic_proyek'   => 'nullable|string|max:100',
            'alamat'       => 'nullable|string|max:300',
            'kota'         => 'nullable|string|max:100',
            'segmen'       => 'nullable|string|max:50',
            'limit_kredit' => 'nullable|integer|min:0',
            'aktif'        => 'boolean',
        ]);

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer->load('salesOrders'));
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'kode'         => 'sometimes|string|max:20|unique:production_customers,kode,' . $customer->id,
            'nama'         => 'sometimes|string|max:200',
            'kontak'       => 'nullable|string|max:100',
            'telepon'      => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:100',
            'npwp'         => 'nullable|string|max:20',
            'pic_proyek'   => 'nullable|string|max:100',
            'alamat'       => 'nullable|string|max:300',
            'kota'         => 'nullable|string|max:100',
            'segmen'       => 'nullable|string|max:50',
            'limit_kredit' => 'nullable|integer|min:0',
            'aktif'        => 'boolean',
        ]);

        $customer->update($validated);
        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
