<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BomHeader;
use App\Models\BomItem;
use App\Models\Product;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BomHeader::with(['product']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 20);
        return response()->json($query->orderBy('version')->paginate($perPage));
    }

    public function show(int $id): JsonResponse
    {
        $bom = BomHeader::with(['product', 'items.material'])->findOrFail($id);

        // Compile warnings if product or any materials are inactive
        $warnings = [];
        if (!$bom->product || !$bom->product->aktif) {
            $warnings[] = "Produk '" . ($bom->product?->nama ?? 'Unknown') . "' sedang tidak aktif.";
        }

        foreach ($bom->items as $item) {
            if (!$item->material || !$item->material->aktif) {
                $warnings[] = "Material '" . ($item->material?->nama ?? 'Unknown') . "' sedang tidak aktif.";
            }
        }

        return response()->json([
            'bom' => $bom,
            'warnings' => $warnings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:production_products,id',
            'version' => 'required|string|max:20',
            'output_qty' => 'required|numeric|gt:0',
            'output_uom' => 'required|string|max:20',
            'overhead_pct' => 'nullable|numeric|between:0,100',
            'bom_efficiency' => 'nullable|numeric|between:0,100',
            'notes' => 'nullable|string|max:300',
            'items' => 'nullable|array',
            'items.*.material_id' => 'required_with:items|exists:production_materials,id',
            'items.*.qty_per_unit' => 'required_with:items|numeric|gt:0',
            'items.*.waste_pct' => 'required_with:items|numeric|min:0',
            'items.*.urutan' => 'nullable|integer',
            'items.*.catatan' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $items = $request->input('items', []);

        // Validate duplicates in items
        $materialIds = array_column($items, 'material_id');
        if (count($materialIds) !== count(array_unique($materialIds))) {
            return response()->json([
                'message' => 'Validasi gagal: Terdapat duplikasi material dalam satu BOM.'
            ], 422);
        }

        $product = Product::findOrFail($request->product_id);

        // Enforce only one draft/active version unique name
        $versionExists = BomHeader::where('product_id', $request->product_id)
            ->where('version', $request->version)
            ->exists();
        if ($versionExists) {
            return response()->json([
                'message' => 'Versi BOM "' . $request->version . '" sudah ada untuk produk ini.'
            ], 422);
        }

        $bom = DB::transaction(function () use ($request, $items) {
            $bom = BomHeader::create([
                'product_id' => $request->product_id,
                'version' => $request->version,
                'output_qty' => $request->output_qty,
                'output_uom' => $request->output_uom,
                'overhead_pct' => $request->input('overhead_pct', 15.00),
                'bom_efficiency' => $request->input('bom_efficiency', 100.00),
                'notes' => $request->notes,
                'status' => 'draft',
                'total_material_cost' => 0,
                'total_waste_cost' => 0,
            ]);

            foreach ($items as $index => $itemData) {
                $material = Material::findOrFail($itemData['material_id']);
                BomItem::create([
                    'bom_header_id' => $bom->id,
                    'material_id' => $itemData['material_id'],
                    'qty_per_unit' => $itemData['qty_per_unit'],
                    'waste_pct' => $itemData['waste_pct'],
                    'urutan' => $itemData['urutan'] ?? ($index + 1),
                    'catatan' => $itemData['catatan'] ?? null,
                    'material_type' => $material->kategori ?? 'Raw Material',
                    'harga_snapshot' => $material->harga,
                ]);
            }

            $bom->recalculateTotals();
            return $bom;
        });

        // Warnings check for response
        $warnings = [];
        if (!$product->aktif) {
            $warnings[] = "Produk ini sedang tidak aktif.";
        }
        foreach ($bom->items as $item) {
            if (!$item->material || !$item->material->aktif) {
                $warnings[] = "Material '" . ($item->material?->nama ?? 'Unknown') . "' sedang tidak aktif.";
            }
        }

        return response()->json([
            'message' => 'Draft BOM berhasil dibuat.',
            'bom' => $bom->load('items.material'),
            'warnings' => $warnings
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $bom = BomHeader::findOrFail($id);

        if ($bom->status !== 'draft') {
            return response()->json([
                'message' => 'BOM yang dapat diedit hanya BOM dengan status Draft.'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'version' => 'required|string|max:20',
            'output_qty' => 'required|numeric|gt:0',
            'output_uom' => 'required|string|max:20',
            'overhead_pct' => 'nullable|numeric|between:0,100',
            'bom_efficiency' => 'nullable|numeric|between:0,100',
            'notes' => 'nullable|string|max:300',
            'items' => 'required|array|min:1',
            'items.*.material_id' => 'required|exists:production_materials,id',
            'items.*.qty_per_unit' => 'required|numeric|gt:0',
            'items.*.waste_pct' => 'required|numeric|min:0',
            'items.*.urutan' => 'nullable|integer',
            'items.*.catatan' => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validate duplicates in items
        $materialIds = array_column($request->items, 'material_id');
        if (count($materialIds) !== count(array_unique($materialIds))) {
            return response()->json([
                'message' => 'Validasi gagal: Terdapat duplikasi material dalam satu BOM.'
            ], 422);
        }

        // Check version unique for other boms of this product
        $versionExists = BomHeader::where('product_id', $bom->product_id)
            ->where('id', '!=', $bom->id)
            ->where('version', $request->version)
            ->exists();
        if ($versionExists) {
            return response()->json([
                'message' => 'Versi BOM "' . $request->version . '" sudah ada untuk produk ini.'
            ], 422);
        }

        DB::transaction(function () use ($bom, $request) {
            $bom->update([
                'version' => $request->version,
                'output_qty' => $request->output_qty,
                'output_uom' => $request->output_uom,
                'overhead_pct' => $request->input('overhead_pct', $bom->overhead_pct ?? 15.00),
                'bom_efficiency' => $request->input('bom_efficiency', $bom->bom_efficiency ?? 100.00),
                'notes' => $request->notes,
            ]);

            // Re-create items to capture fresh snapshots
            $bom->items()->delete();

            foreach ($request->items as $index => $itemData) {
                $material = Material::findOrFail($itemData['material_id']);
                BomItem::create([
                    'bom_header_id' => $bom->id,
                    'material_id' => $itemData['material_id'],
                    'qty_per_unit' => $itemData['qty_per_unit'],
                    'waste_pct' => $itemData['waste_pct'],
                    'urutan' => $itemData['urutan'] ?? ($index + 1),
                    'catatan' => $itemData['catatan'] ?? null,
                    'material_type' => $material->kategori ?? 'Raw Material',
                    'harga_snapshot' => $material->harga,
                ]);
            }

            $bom->recalculateTotals();
        });

        return response()->json([
            'message' => 'BOM berhasil diperbarui.',
            'bom' => $bom->fresh('items.material')
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $bom = BomHeader::findOrFail($id);

        if ($bom->status !== 'draft') {
            return response()->json([
                'message' => 'BOM yang dapat dihapus hanya BOM dengan status Draft.'
            ], 422);
        }

        $bom->delete();

        return response()->json([
            'message' => 'BOM Draft berhasil dihapus.'
        ]);
    }

    public function activate(int $id): JsonResponse
    {
        $bom = BomHeader::findOrFail($id);
        $product = Product::findOrFail($bom->product_id);

        if (!$product->aktif) {
            return response()->json([
                'message' => 'Gagal mengaktifkan BOM: Produk tidak aktif.'
            ], 422);
        }

        DB::transaction(function () use ($bom, $product) {
            // Archive previous active BOMs for this product
            BomHeader::where('product_id', $product->id)
                ->where('status', 'active')
                ->update(['status' => 'archived']);

            // Set this BOM to active
            $bom->update(['status' => 'active']);
        });

        return response()->json([
            'message' => 'BOM berhasil diaktifkan.',
            'bom' => $bom->fresh()
        ]);
    }

    public function archive(int $id): JsonResponse
    {
        $bom = BomHeader::findOrFail($id);

        if ($bom->status !== 'active') {
            return response()->json([
                'message' => 'Hanya BOM aktif yang dapat diarsipkan.'
            ], 422);
        }

        $bom->update(['status' => 'archived']);

        return response()->json([
            'message' => 'BOM berhasil diarsipkan.',
            'bom' => $bom->fresh()
        ]);
    }

    public function unarchive(int $id): JsonResponse
    {
        $bom = BomHeader::findOrFail($id);

        if ($bom->status !== 'archived') {
            return response()->json([
                'message' => 'Hanya BOM terarsip yang dapat dikembalikan ke Draft.'
            ], 422);
        }

        $bom->update(['status' => 'draft']);

        return response()->json([
            'message' => 'BOM berhasil dikembalikan ke status Draft.',
            'bom' => $bom->fresh()
        ]);
    }

    public function clone(int $id, Request $request): JsonResponse
    {
        $bom = BomHeader::with('items')->findOrFail($id);

        $newVersion = $request->input('version');
        if (empty($newVersion)) {
            $newVersion = $bom->version . ' - Copy';
        }

        // Verify version name uniqueness
        $versionExists = BomHeader::where('product_id', $bom->product_id)
            ->where('version', $newVersion)
            ->exists();
        if ($versionExists) {
            return response()->json([
                'message' => 'Versi clone "' . $newVersion . '" sudah ada untuk produk ini.'
            ], 422);
        }

        $clonedBom = DB::transaction(function () use ($bom, $newVersion) {
            $newBom = BomHeader::create([
                'product_id' => $bom->product_id,
                'version' => $newVersion,
                'output_qty' => $bom->output_qty,
                'output_uom' => $bom->output_uom,
                'overhead_pct' => $bom->overhead_pct,
                'bom_efficiency' => $bom->bom_efficiency,
                'notes' => $bom->notes ? ($bom->notes . ' (Kloningan)') : 'Kloningan',
                'status' => 'draft',
                'total_material_cost' => 0,
                'total_waste_cost' => 0,
            ]);

            foreach ($bom->items as $item) {
                // Fetch live material price for fresh snapshot
                $material = Material::findOrFail($item->material_id);
                BomItem::create([
                    'bom_header_id' => $newBom->id,
                    'material_id' => $item->material_id,
                    'qty_per_unit' => $item->qty_per_unit,
                    'waste_pct' => $item->waste_pct,
                    'urutan' => $item->urutan,
                    'catatan' => $item->catatan,
                    'material_type' => $material->kategori ?? 'Raw Material',
                    'harga_snapshot' => $material->harga,
                ]);
            }

            $newBom->recalculateTotals();
            return $newBom;
        });

        return response()->json([
            'message' => 'BOM berhasil dikloning sebagai Draft.',
            'bom' => $clonedBom->load('items.material')
        ], 201);
    }

    public function getByProduct(int $productId): JsonResponse
    {
        $boms = BomHeader::where('product_id', $productId)
            ->orderBy('version')
            ->get();
        return response()->json($boms);
    }

    public function getActiveBom(int $productId): JsonResponse
    {
        $bom = BomHeader::with('items.material')
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->first();

        if (!$bom) {
            return response()->json([
                'message' => 'Tidak ada BOM aktif untuk produk ini.'
            ], 404);
        }

        return response()->json($bom);
    }
}
