<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QcInspection;
use App\Models\QcDefect;
use App\Models\QcParameterValue;
use App\Models\ProductionBatch;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class QcInspectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->checkPermission('qc.view');

        $query = QcInspection::query()
            ->with(['batch', 'product', 'inspector', 'defects.category', 'parameterValues.parameter']);

        if ($request->filled('batch_id')) {
            $query->where('production_batch_id', $request->input('batch_id'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        $inspections = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));

        return response()->json($inspections);
    }

    public function show(int $id): JsonResponse
    {
        $this->checkPermission('qc.view');

        $inspection = QcInspection::with(['batch', 'product', 'inspector', 'defects.category', 'parameterValues.parameter'])
            ->findOrFail($id);

        return response()->json($inspection);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('qc.create');

        $request->validate([
            'production_batch_id' => 'required|exists:production_batches,id',
            'inspection_date'     => 'required|date',
            'qty_inspected'       => 'required|integer|min:1',
            'qty_passed'          => 'required|integer|min:0',
            'qty_rejected'        => 'required|integer|min:0',
            'notes'               => 'nullable|string',
            'photo'               => 'nullable|image|mimes:jpeg,jpg,png|max:5120', // max 5MB
            'defects'             => 'nullable|array',
            'defects.*.defect_category_id' => 'required|exists:production_defect_categories,id',
            'defects.*.qty'       => 'required|integer|min:1',
            'defects.*.notes'     => 'nullable|string',
            'parameters'          => 'nullable|array',
            'parameters.*.qc_parameter_id' => 'required|exists:production_qc_parameters,id',
            'parameters.*.value'  => 'required|string',
            'parameters.*.is_passed' => 'required|boolean',
            'parameters.*.notes'  => 'nullable|string'
        ]);

        $qtyInspected = (int) $request->input('qty_inspected');
        $qtyPassed = (int) $request->input('qty_passed');
        $qtyRejected = (int) $request->input('qty_rejected');

        // 1. Strict Validation: qty_passed + qty_rejected = qty_inspected
        if (($qtyPassed + $qtyRejected) !== $qtyInspected) {
            throw ValidationException::withMessages([
                'qty_inspected' => ['Jumlah Qty Pass dan Qty Reject harus sama dengan Qty Inspected.']
            ]);
        }

        // 2. Validate sum of defect quantities equals qty_rejected if qty_rejected > 0
        $defects = $request->input('defects', []);
        if ($qtyRejected > 0) {
            $totalDefectQty = array_sum(array_column($defects, 'qty'));
            if ($totalDefectQty !== $qtyRejected) {
                throw ValidationException::withMessages([
                    'defects' => ["Jumlah kuantitas defect ({$totalDefectQty}) harus sama dengan Qty Reject ({$qtyRejected})."]
                ]);
            }
        }

        return DB::transaction(function () use ($request, $qtyInspected, $qtyPassed, $qtyRejected, $defects) {
            $batch = ProductionBatch::findOrFail($request->input('production_batch_id'));

            $deliveredStatusId = DB::table('global.production_batch_statuses')
                ->where('status', 'Delivered')
                ->value('id');

            if ($deliveredStatusId && $batch->batch_status_id === $deliveredStatusId) {
                throw ValidationException::withMessages([
                    'production_batch_id' => ['Batch yang sudah dalam tahap Delivery tidak dapat dilakukan QC Inspection.']
                ]);
            }
            
            // Handle photo upload
            $photoPath = null;
            if ($request->hasFile('photo')) {
                // Upload to storage/app/public/qc
                $photoPath = $request->file('photo')->store('qc', 'public');
            }

            // Map computed status for compatibility
            $calculatedStatus = 'PASS';
            if ($qtyRejected > 0) {
                $calculatedStatus = $qtyPassed > 0 ? 'PARTIAL_PASS' : 'REJECT';
            }

            $user = Auth::user();
            $inspectorName = $user ? $user->name : 'System Inspector';

            // Generate unique QC number
            $noStr = 'QC-' . now()->format('Y') . '-' . str_pad(QcInspection::count() + 1, 4, '0', STR_PAD_LEFT);

            // Create QC Inspection
            $inspection = QcInspection::create([
                'no'                  => $noStr,
                'production_order_id' => null,
                'product_id'          => $batch->product_id,
                'qty'                 => $qtyInspected, // old column
                'dimensi_ok'          => $qtyPassed, // old column
                'dimensi_reject'      => $qtyRejected, // old column
                'status'              => $calculatedStatus === 'PASS' ? 'Lulus' : ($calculatedStatus === 'PARTIAL_PASS' ? 'Lulus Bersyarat' : 'Reject'), // old column mapping
                'inspektur'           => $inspectorName, // old column
                'tanggal'             => $request->input('inspection_date'), // old column
                'catatan'             => $request->input('notes'), // old column

                'production_batch_id' => $batch->id,
                'inspection_date'     => $request->input('inspection_date'),
                'qty_inspected'       => $qtyInspected,
                'qty_passed'          => $qtyPassed,
                'qty_rejected'        => $qtyRejected,
                'notes'               => $request->input('notes'),
                'photo_path'          => $photoPath,
                'inspector_id'        => Auth::id()
            ]);

            // Save defects
            foreach ($defects as $defect) {
                QcDefect::create([
                    'inspection_id'      => $inspection->id,
                    'defect_category_id' => $defect['defect_category_id'],
                    'qty'                => $defect['qty'],
                    'notes'              => $defect['notes'] ?? null
                ]);
            }

            // Save parameter values
            $parameters = $request->input('parameters', []);
            foreach ($parameters as $param) {
                QcParameterValue::create([
                    'inspection_id'   => $inspection->id,
                    'qc_parameter_id' => $param['qc_parameter_id'],
                    'value'           => $param['value'],
                    'is_passed'       => $param['is_passed'],
                    'notes'           => $param['notes'] ?? null
                ]);
            }

            // Log Audit
            AuditLog::log('qc.inspection.created', 'qc_inspection', $inspection->id, null, $inspection->toArray());

            return response()->json($inspection->load(['batch', 'product', 'inspector', 'defects.category', 'parameterValues.parameter']), 201);
        });
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('qc.update');

        $inspection = QcInspection::findOrFail($id);

        $request->validate([
            'inspection_date' => 'sometimes|required|date',
            'qty_inspected'   => 'sometimes|required|integer|min:1',
            'qty_passed'      => 'sometimes|required|integer|min:0',
            'qty_rejected'    => 'sometimes|required|integer|min:0',
            'notes'           => 'nullable|string',
            'photo'           => 'nullable|image|mimes:jpeg,jpg,png|max:5120', // max 5MB
            'defects'         => 'nullable|array',
            'defects.*.defect_category_id' => 'required|exists:production_defect_categories,id',
            'defects.*.qty'   => 'required|integer|min:1',
            'defects.*.notes' => 'nullable|string',
            'parameters'      => 'nullable|array',
            'parameters.*.qc_parameter_id' => 'required|exists:production_qc_parameters,id',
            'parameters.*.value' => 'required|string',
            'parameters.*.is_passed' => 'required|boolean',
            'parameters.*.notes' => 'nullable|string'
        ]);

        $qtyInspected = $request->has('qty_inspected') ? (int) $request->input('qty_inspected') : $inspection->qty_inspected;
        $qtyPassed = $request->has('qty_passed') ? (int) $request->input('qty_passed') : $inspection->qty_passed;
        $qtyRejected = $request->has('qty_rejected') ? (int) $request->input('qty_rejected') : $inspection->qty_rejected;

        // Strict Validation
        if (($qtyPassed + $qtyRejected) !== $qtyInspected) {
            throw ValidationException::withMessages([
                'qty_inspected' => ['Jumlah Qty Pass dan Qty Reject harus sama dengan Qty Inspected.']
            ]);
        }

        $defects = $request->input('defects', []);
        if ($qtyRejected > 0 && $request->has('defects')) {
            $totalDefectQty = array_sum(array_column($defects, 'qty'));
            if ($totalDefectQty !== $qtyRejected) {
                throw ValidationException::withMessages([
                    'defects' => ["Jumlah kuantitas defect ({$totalDefectQty}) harus sama dengan Qty Reject ({$qtyRejected})."]
                ]);
            }
        }

        return DB::transaction(function () use ($request, $inspection, $qtyInspected, $qtyPassed, $qtyRejected, $defects) {
            $oldValues = $inspection->toArray();

            // Handle photo replacement
            $photoPath = $inspection->photo_path;
            if ($request->hasFile('photo')) {
                if ($photoPath) {
                    Storage::disk('public')->delete($photoPath);
                }
                $photoPath = $request->file('photo')->store('qc', 'public');
            }

            // Map computed status for compatibility
            $calculatedStatus = 'PASS';
            if ($qtyRejected > 0) {
                $calculatedStatus = $qtyPassed > 0 ? 'PARTIAL_PASS' : 'REJECT';
            }

            $inspection->update([
                'qty'            => $qtyInspected, // old
                'dimensi_ok'     => $qtyPassed, // old
                'dimensi_reject' => $qtyRejected, // old
                'status'         => $calculatedStatus === 'PASS' ? 'Lulus' : ($calculatedStatus === 'PARTIAL_PASS' ? 'Lulus Bersyarat' : 'Reject'), // old column mapping
                'tanggal'        => $request->input('inspection_date', $inspection->inspection_date), // old
                'catatan'        => $request->input('notes', $inspection->notes), // old

                'inspection_date' => $request->input('inspection_date', $inspection->inspection_date),
                'qty_inspected'   => $qtyInspected,
                'qty_passed'      => $qtyPassed,
                'qty_rejected'    => $qtyRejected,
                'notes'           => $request->input('notes', $inspection->notes),
                'photo_path'      => $photoPath
            ]);

            // Recreate defects if defects passed in request
            if ($request->has('defects')) {
                $inspection->defects()->delete();
                foreach ($defects as $defect) {
                    QcDefect::create([
                        'inspection_id'      => $inspection->id,
                        'defect_category_id' => $defect['defect_category_id'],
                        'qty'                => $defect['qty'],
                        'notes'              => $defect['notes'] ?? null
                    ]);
                }
            }

            // Recreate parameter values if parameters passed in request
            if ($request->has('parameters')) {
                $inspection->parameterValues()->delete();
                $parameters = $request->input('parameters', []);
                foreach ($parameters as $param) {
                    QcParameterValue::create([
                        'inspection_id'   => $inspection->id,
                        'qc_parameter_id' => $param['qc_parameter_id'],
                        'value'           => $param['value'],
                        'is_passed'       => $param['is_passed'],
                        'notes'           => $param['notes'] ?? null
                    ]);
                }
            }

            // Log Audit
            AuditLog::log('qc.inspection.updated', 'qc_inspection', $inspection->id, $oldValues, $inspection->fresh()->toArray());

            return response()->json($inspection->load(['batch', 'product', 'inspector', 'defects.category', 'parameterValues.parameter']));
        });
    }

    public function destroy(int $id): JsonResponse
    {
        $this->checkPermission('qc.delete');

        $inspection = QcInspection::findOrFail($id);

        DB::transaction(function () use ($inspection) {
            $oldValues = $inspection->toArray();

            // Delete associated photo if exists
            if ($inspection->photo_path) {
                Storage::disk('public')->delete($inspection->photo_path);
            }

            // Cascade delete children
            $inspection->defects()->delete();
            $inspection->parameterValues()->delete();
            $inspection->delete();

            // Log Audit
            AuditLog::log('qc.inspection.deleted', 'qc_inspection', $inspection->id, $oldValues, null);
        });

        return response()->json(['message' => 'Inspection deleted successfully.']);
    }

    public function dashboard(): JsonResponse
    {
        $this->checkPermission('qc.view');

        $today = now()->format('Y-m-d');

        // 1. Inspections Today
        $inspectionsToday = (int) QcInspection::where('inspection_date', $today)->count();

        // 2. Passed Today
        $passedToday = (int) QcInspection::where('inspection_date', $today)->sum('qty_passed');

        // 3. Rejected Today
        $rejectedToday = (int) QcInspection::where('inspection_date', $today)->sum('qty_rejected');

        // 4. Reject Rate Today
        $qtyInspectedToday = (int) QcInspection::where('inspection_date', $today)->sum('qty_inspected');
        $rejectRate = 0.0;
        if ($qtyInspectedToday > 0) {
            $rejectRate = round(($rejectedToday / $qtyInspectedToday) * 100, 2);
        }

        // 5. Batch Waiting QC (BS-05 or name containing QC)
        $qcStatusIds = DB::table('global.production_batch_statuses')
            ->where('aktif', true)
            ->whereRaw('LOWER(status) LIKE ?', ['%qc%'])
            ->pluck('id');

        $batchesWaitingQc = (int) DB::table('public.production_batches')
            ->whereIn('batch_status_id', $qcStatusIds)
            ->whereNull('deleted_at')
            ->count();

        // 6. Top Defect Categories
        $topDefectCategories = DB::table('public.production_qc_defects as pd')
            ->join('global.production_defect_categories as dc', 'pd.defect_category_id', '=', 'dc.id')
            ->selectRaw('dc.nama as alasan, SUM(pd.qty) as jumlah')
            ->groupBy('dc.nama')
            ->orderByDesc('jumlah')
            ->get();

        // 7. Defect Trend (Last 7 Days)
        $defectTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dateLabel = now()->subDays($i)->translatedFormat('d M');

            $totalInspected = (int) QcInspection::where('inspection_date', $date)->sum('qty_inspected');
            $totalRejected = (int) QcInspection::where('inspection_date', $date)->sum('qty_rejected');
            $totalPassed = (int) QcInspection::where('inspection_date', $date)->sum('qty_passed');

            $rate = 0.0;
            if ($totalInspected > 0) {
                $rate = round(($totalRejected / $totalInspected) * 100, 2);
            }

            $defectTrend[] = [
                'tanggal'   => $dateLabel,
                'inspected' => $totalInspected,
                'passed'    => $totalPassed,
                'rejected'  => $totalRejected,
                'rate'      => $rate
            ];
        }

        return response()->json([
            'inspections_today'     => $inspectionsToday,
            'passed_today'          => $passedToday,
            'rejected_today'        => $rejectedToday,
            'reject_rate'           => $rejectRate,
            'batches_waiting_qc'    => $batchesWaitingQc,
            'top_defect_categories' => $topDefectCategories,
            'defect_trend'          => $defectTrend
        ]);
    }

    private function checkPermission(string $permission): void
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        // Bypassed for super_admin
        if ($user->role === 'super_admin' || ($user->roleModel && $user->roleModel->kode === 'super_admin')) {
            return;
        }

        $hasPerm = DB::table('global.user_role_permissions as urp')
            ->join('global.system_modules as sm', 'urp.module_id', '=', 'sm.id')
            ->where('urp.role_id', $user->role_id)
            ->where('sm.kode', 'qc')
            ->where(function ($q) use ($permission) {
                if ($permission === 'qc.view') $q->where('urp.can_view', true);
                if ($permission === 'qc.create') $q->where('urp.can_create', true);
                if ($permission === 'qc.update') $q->where('urp.can_edit', true);
                if ($permission === 'qc.delete') $q->where('urp.can_delete', true);
            })
            ->exists();

        if (!$hasPerm) {
            abort(403, "Forbidden: Insufficient privileges for permission '{$permission}'.");
        }
    }
}
