<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->whereNull('deleted_at');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kode', 'ilike', "%{$request->search}%")
                  ->orWhere('nama', 'ilike', "%{$request->search}%");
            });
        }
        if ($request->boolean('active_only')) {
            $query->where('aktif', true);
        }
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        $data = $query->orderBy('kode')->paginate($request->get('per_page', 20));

        foreach ($data->items() as $product) {
            $product->available_stock = (float) \Illuminate\Support\Facades\DB::table('public.production_inventory_batches')
                ->where('product_id', $product->id)
                ->where('warehouse', 'WH-FG')
                ->where('status', 'Available')
                ->selectRaw('SUM(qty_on_hand - qty_reserved) as avail')
                ->value('avail') ?: 0.0;
        }

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'     => 'required|string|max:30|unique:production_products,kode',
            'nama'     => 'required|string|max:200',
            'foto'     => 'nullable|image|max:2048',
            'kategori' => 'nullable|string|max:50',
            'varian'   => 'nullable|string|max:50',
            'spek'     => 'nullable|string|max:100',
            'grade'    => 'nullable|string|max:20',
            'berat'    => 'nullable|numeric|min:0',
            'volume_m3' => 'nullable|numeric|min:0',
            'harga'    => 'nullable|integer|min:0',
            'satuan'   => 'nullable|string|max:20',
            'standar'  => 'nullable|string|max:50',
            'aktif'    => 'boolean',
        ]);

        if ($request->hasFile('foto')) {
            $validated['foto'] = $this->compressAndSaveImage($request->file('foto'), base_path('uploads/products'));
        }

        if (!empty($validated['kategori'])) {
            ProductCategory::firstOrCreate(
                ['nama' => $validated['kategori']],
                ['kode' => 'CAT-' . strtoupper(substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), 0, 5))]
            );
        }
        if (!empty($validated['varian'])) {
            ProductType::firstOrCreate(
                ['nama' => $validated['varian']],
                ['kode' => 'TYP-' . strtoupper(substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), 0, 5))]
            );
        }

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->available_stock = (float) \Illuminate\Support\Facades\DB::table('public.production_inventory_batches')
            ->where('product_id', $product->id)
            ->where('warehouse', 'WH-FG')
            ->where('status', 'Available')
            ->selectRaw('SUM(qty_on_hand - qty_reserved) as avail')
            ->value('avail') ?: 0.0;

        return response()->json($product->load(['bomHeaders.items.material']));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'nama'     => 'sometimes|string|max:200',
            'foto'     => 'nullable|image|max:2048',
            'kategori' => 'nullable|string|max:50',
            'varian'   => 'nullable|string|max:50',
            'spek'     => 'nullable|string|max:100',
            'grade'    => 'nullable|string|max:20',
            'berat'    => 'nullable|numeric|min:0',
            'volume_m3' => 'nullable|numeric|min:0',
            'harga'    => 'nullable|integer|min:0',
            'satuan'   => 'nullable|string|max:20',
            'standar'  => 'nullable|string|max:50',
            'aktif'    => 'boolean',
        ]);

        if ($request->hasFile('foto')) {
            if ($product->foto && file_exists(base_path($product->foto))) {
                @unlink(base_path($product->foto));
            }
            $validated['foto'] = $this->compressAndSaveImage($request->file('foto'), base_path('uploads/products'));
        }

        if (!empty($validated['kategori'])) {
            ProductCategory::firstOrCreate(
                ['nama' => $validated['kategori']],
                ['kode' => 'CAT-' . strtoupper(substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), 0, 5))]
            );
        }
        if (!empty($validated['varian'])) {
            ProductType::firstOrCreate(
                ['nama' => $validated['varian']],
                ['kode' => 'TYP-' . strtoupper(substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), 0, 5))]
            );
        }

        $product->update($validated);
        return response()->json($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->foto && file_exists(base_path($product->foto))) {
            @unlink(base_path($product->foto));
        }
        $product->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Compress image to PNG with max 1000px resolution and level 9 compression.
     */
    private function compressAndSaveImage($file, $destinationDirectory)
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        // Fallback: if GD extension is not enabled on the server, just move the original file
        if (!function_exists('imagecreatefromjpeg') || !function_exists('imagepng')) {
            $filename = time() . '_' . uniqid() . '.' . $extension;
            if (!file_exists($destinationDirectory)) {
                mkdir($destinationDirectory, 0755, true);
            }
            $file->move($destinationDirectory, $filename);
            return '/uploads/products/' . $filename;
        }

        $filename = time() . '_' . uniqid() . '.png';
        
        if (!file_exists($destinationDirectory)) {
            mkdir($destinationDirectory, 0755, true);
        }
        
        $sourcePath = $file->getRealPath();
        $targetPath = $destinationDirectory . '/' . $filename;
        
        switch ($extension) {
            case 'jpeg':
            case 'jpg':
                $image = @imagecreatefromjpeg($sourcePath);
                break;
            case 'png':
                $image = @imagecreatefrompng($sourcePath);
                break;
            case 'webp':
                $image = @imagecreatefromwebp($sourcePath);
                break;
            case 'gif':
                $image = @imagecreatefromgif($sourcePath);
                break;
            default:
                $image = false;
        }
        
        if (!$image) {
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $file->move($destinationDirectory, $filename);
            return '/uploads/products/' . $filename;
        }
        
        $width = imagesx($image);
        $height = imagesy($image);
        $maxDim = 1000;
        
        if ($width > $maxDim || $height > $maxDim) {
            $ratio = $width / $height;
            if ($ratio > 1) {
                $newWidth = $maxDim;
                $newHeight = (int)($maxDim / $ratio);
            } else {
                $newHeight = $maxDim;
                $newWidth = (int)($maxDim * $ratio);
            }
            
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            
            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resizedImage;
        }
        
        imagepng($image, $targetPath, 9); // Compression level 9 (0 = no compression, 9 = maximum compression)
        imagedestroy($image);
        
        return '/uploads/products/' . $filename;
    }
}
