<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\ProductSpec;
use App\Models\ConcreteGrade;
use App\Models\MaterialCategory;
use App\Models\Mold;
use App\Models\Warehouse;
use App\Models\Machine;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\QcParameter;
use App\Models\DefectCategory;
use App\Models\ProductionStatus;
use App\Models\DeliveryStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// ─────────────────────────────────────────────
// Kategori Produk
// ─────────────────────────────────────────────
class ProductCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductCategory::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:global.production_product_categories,kode',
            'nama'      => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductCategory::create($validated), 201);
    }

    public function show(ProductCategory $productCategory): JsonResponse
    {
        return response()->json($productCategory);
    }

    public function update(Request $request, ProductCategory $productCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_product_categories,kode,' . $productCategory->id,
            'nama'      => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        $productCategory->update($validated);
        return response()->json($productCategory->fresh());
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $productCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Tipe Produk
// ─────────────────────────────────────────────
class ProductTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductType::query()->whereNull('deleted_at');
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
            'kode'        => 'required|string|max:20|unique:global.production_product_types,kode',
            'kategori'    => 'nullable|string|max:100',
            'nama'        => 'required|string|max:100',
            'kode_prefix' => 'nullable|string|max:10',
            'standar'     => 'nullable|string|max:100',
            'aktif'       => 'boolean',
        ]);
        return response()->json(ProductType::create($validated), 201);
    }

    public function show(ProductType $productType): JsonResponse
    {
        return response()->json($productType);
    }

    public function update(Request $request, ProductType $productType): JsonResponse
    {
        $validated = $request->validate([
            'kode'        => 'sometimes|string|max:20|unique:global.production_product_types,kode,' . $productType->id,
            'kategori'    => 'nullable|string|max:100',
            'nama'        => 'sometimes|string|max:100',
            'kode_prefix' => 'nullable|string|max:10',
            'standar'     => 'nullable|string|max:100',
            'aktif'       => 'boolean',
        ]);
        $productType->update($validated);
        return response()->json($productType->fresh());
    }

    public function destroy(ProductType $productType): JsonResponse
    {
        $productType->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Spesifikasi Produk
// ─────────────────────────────────────────────
class ProductSpecController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductSpec::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('produk', 'like', "%{$request->search}%");
            });
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:30|unique:global.production_product_specs,kode',
            'produk'    => 'required|string|max:200',
            'dimensi'   => 'nullable|string|max:100',
            'toleransi' => 'nullable|string|max:50',
            'berat'     => 'nullable|string|max:50',
            'grade'     => 'nullable|string|max:20',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductSpec::create($validated), 201);
    }

    public function show(ProductSpec $productSpec): JsonResponse
    {
        return response()->json($productSpec);
    }

    public function update(Request $request, ProductSpec $productSpec): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:30|unique:global.production_product_specs,kode,' . $productSpec->id,
            'produk'    => 'sometimes|string|max:200',
            'dimensi'   => 'nullable|string|max:100',
            'toleransi' => 'nullable|string|max:50',
            'berat'     => 'nullable|string|max:50',
            'grade'     => 'nullable|string|max:20',
            'aktif'     => 'boolean',
        ]);
        $productSpec->update($validated);
        return response()->json($productSpec->fresh());
    }

    public function destroy(ProductSpec $productSpec): JsonResponse
    {
        $productSpec->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Mutu Beton
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Kategori Material
// ─────────────────────────────────────────────
class MaterialCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = MaterialCategory::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:global.production_material_categories,kode',
            'nama'      => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'contoh'    => 'nullable|string|max:300',
            'aktif'     => 'boolean',
        ]);
        return response()->json(MaterialCategory::create($validated), 201);
    }

    public function show(MaterialCategory $materialCategory): JsonResponse
    {
        return response()->json($materialCategory);
    }

    public function update(Request $request, MaterialCategory $materialCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_material_categories,kode,' . $materialCategory->id,
            'nama'      => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'contoh'    => 'nullable|string|max:300',
            'aktif'     => 'boolean',
        ]);
        $materialCategory->update($validated);
        return response()->json($materialCategory->fresh());
    }

    public function destroy(MaterialCategory $materialCategory): JsonResponse
    {
        $materialCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Cetakan (Molds)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Gudang (Warehouses)
// ─────────────────────────────────────────────
class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Warehouse::query()->whereNull('deleted_at');
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
            'kode'      => 'required|string|max:20|unique:global.production_warehouses,kode',
            'nama'      => 'required|string|max:100',
            'tipe'      => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:200',
            'kapasitas' => 'nullable|string|max:50',
            'utilisasi' => 'nullable|integer|min:0|max:100',
            'aktif'     => 'boolean',
        ]);
        return response()->json(Warehouse::create($validated), 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_warehouses,kode,' . $warehouse->id,
            'nama'      => 'sometimes|string|max:100',
            'tipe'      => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:200',
            'kapasitas' => 'nullable|string|max:50',
            'utilisasi' => 'nullable|integer|min:0|max:100',
            'aktif'     => 'boolean',
        ]);
        $warehouse->update($validated);
        return response()->json($warehouse->fresh());
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $warehouse->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Mesin (Machines)
// ─────────────────────────────────────────────
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
            'kode'             => 'required|string|max:20|unique:global.production_machines,kode',
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
            'kode'             => 'sometimes|string|max:20|unique:global.production_machines,kode,' . $machine->id,
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

// ─────────────────────────────────────────────
// Karyawan (Employees)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Shift Kerja
// ─────────────────────────────────────────────
class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Shift::query()->whereNull('deleted_at');
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
            'kode'           => 'required|string|max:20|unique:global.production_shifts,kode',
            'nama'           => 'required|string|max:50',
            'jam'            => 'nullable|string|max:30',
            'supervisor'     => 'nullable|string|max:100',
            'jumlah_pekerja' => 'nullable|integer|min:0',
            'aktif'          => 'boolean',
        ]);
        return response()->json(Shift::create($validated), 201);
    }

    public function show(Shift $shift): JsonResponse
    {
        return response()->json($shift);
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $validated = $request->validate([
            'kode'           => 'sometimes|string|max:20|unique:global.production_shifts,kode,' . $shift->id,
            'nama'           => 'sometimes|string|max:50',
            'jam'            => 'nullable|string|max:30',
            'supervisor'     => 'nullable|string|max:100',
            'jumlah_pekerja' => 'nullable|integer|min:0',
            'aktif'          => 'boolean',
        ]);
        $shift->update($validated);
        return response()->json($shift->fresh());
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $shift->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Parameter QC
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Kategori Defect
// ─────────────────────────────────────────────
class DefectCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = DefectCategory::query()->whereNull('deleted_at');
        if ($request->filled('search')) {
            $q->where(function ($qq) use ($request) {
                $qq->where('kode', 'like', "%{$request->search}%")
                   ->orWhere('nama', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('tingkat')) {
            $q->where('tingkat', $request->tingkat);
        }
        return response()->json($q->orderBy('kode')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'          => 'required|string|max:20|unique:global.production_defect_categories,kode',
            'nama'          => 'required|string|max:100',
            'warna'         => 'nullable|string|max:10',
            'tingkat'       => 'nullable|in:Kritis,Mayor,Minor',
            'penyebab_umum' => 'nullable|string|max:300',
            'disposisi'     => 'nullable|string|max:200',
            'aktif'         => 'boolean',
        ]);
        return response()->json(DefectCategory::create($validated), 201);
    }

    public function show(DefectCategory $defectCategory): JsonResponse
    {
        return response()->json($defectCategory);
    }

    public function update(Request $request, DefectCategory $defectCategory): JsonResponse
    {
        $validated = $request->validate([
            'kode'          => 'sometimes|string|max:20|unique:global.production_defect_categories,kode,' . $defectCategory->id,
            'nama'          => 'sometimes|string|max:100',
            'warna'         => 'nullable|string|max:10',
            'tingkat'       => 'nullable|in:Kritis,Mayor,Minor',
            'penyebab_umum' => 'nullable|string|max:300',
            'disposisi'     => 'nullable|string|max:200',
            'aktif'         => 'boolean',
        ]);
        $defectCategory->update($validated);
        return response()->json($defectCategory->fresh());
    }

    public function destroy(DefectCategory $defectCategory): JsonResponse
    {
        $defectCategory->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Status Produksi
// ─────────────────────────────────────────────
class ProductionStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductionStatus::query();
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
            'kode'      => 'required|string|max:20|unique:global.production_statuses,kode',
            'status'    => 'required|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        return response()->json(ProductionStatus::create($validated), 201);
    }

    public function show(ProductionStatus $productionStatus): JsonResponse
    {
        return response()->json($productionStatus);
    }

    public function update(Request $request, ProductionStatus $productionStatus): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:20|unique:global.production_statuses,kode,' . $productionStatus->id,
            'status'    => 'sometimes|string|max:100',
            'urutan'    => 'nullable|integer|min:0',
            'warna'     => 'nullable|string|max:10',
            'deskripsi' => 'nullable|string',
            'aktif'     => 'boolean',
        ]);
        $productionStatus->update($validated);
        return response()->json($productionStatus->fresh());
    }

    public function destroy(ProductionStatus $productionStatus): JsonResponse
    {
        $productionStatus->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}

// ─────────────────────────────────────────────
// Status Pengiriman
// ─────────────────────────────────────────────
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
