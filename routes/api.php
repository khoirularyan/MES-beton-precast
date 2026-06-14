<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\ProductionDemandController;
use App\Http\Controllers\Api\ProductionPlanController;
use App\Http\Controllers\Api\ProductionBatchController;
use App\Http\Controllers\Api\WorkCenterController;
use App\Http\Controllers\Api\WorkOrderController;
use App\Http\Controllers\Api\CuringController;
use App\Http\Controllers\Api\QcInspectionController;
use App\Http\Controllers\Api\DeliveryOrderController;

/*
|--------------------------------------------------------------------------
| API Routes — RBAC Protected
|--------------------------------------------------------------------------
| Security layers applied to every route:
|   1. auth       — user must be authenticated
|   2. active     — user's is_active must be true
|   3. permission — user's role must grant the required permission (where needed)
|
| Middleware aliases (registered in bootstrap/app.php):
|   active         → EnsureUserActive
|   permission:X   → EnsurePermission with $permission = X
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'active'])->group(function () {

    // ── Dashboard — any authenticated active user ────────────────────────────
    Route::get('dashboard', [DashboardController::class, 'index']);

    // ============================================================
    // MASTER DATA
    // Reads  : any authenticated active user (master-data.view — see Rbac.php,
    //          every role has at least 'master-data.view')
    // Writes : requires master-data.manage
    //          (super_admin, admin, ppic — see Rbac::PERMISSIONS)
    // ============================================================

    // Controller map for all master data resources
    $masterData = [
        'products'            => \App\Http\Controllers\Api\ProductController::class,
        'materials'           => \App\Http\Controllers\Api\MaterialController::class,
        'work-centers'        => \App\Http\Controllers\Api\WorkCenterController::class,
        'suppliers'           => \App\Http\Controllers\Api\SupplierController::class,
        'customers'           => \App\Http\Controllers\Api\CustomerController::class,
        'product-categories'  => \App\Http\Controllers\Api\ProductCategoryController::class,
        'product-types'       => \App\Http\Controllers\Api\ProductTypeController::class,
        'product-specs'       => \App\Http\Controllers\Api\ProductSpecController::class,
        'concrete-grades'     => \App\Http\Controllers\Api\ConcreteGradeController::class,
        'material-categories' => \App\Http\Controllers\Api\MaterialCategoryController::class,
        'molds'               => \App\Http\Controllers\Api\MoldController::class,
        'warehouses'          => \App\Http\Controllers\Api\WarehouseController::class,
        'shifts'              => \App\Http\Controllers\Api\ShiftController::class,
        'batch-statuses'      => \App\Http\Controllers\Api\BatchStatusController::class,
        'qc-parameters'       => \App\Http\Controllers\Api\QcParameterController::class,
        'defect-categories'   => \App\Http\Controllers\Api\DefectCategoryController::class,
        'production-statuses' => \App\Http\Controllers\Api\ProductionStatusController::class,
        'delivery-statuses'   => \App\Http\Controllers\Api\DeliveryStatusController::class,
    ];

    // Read-only: all authenticated active users (every role has master-data.view)
    foreach ($masterData as $uri => $controller) {
        Route::apiResource($uri, $controller)->only(['index', 'show']);
    }

    // BOM Read Routes
    Route::get('boms', [\App\Http\Controllers\Api\BomController::class, 'index']);
    Route::get('boms/{id}', [\App\Http\Controllers\Api\BomController::class, 'show']);
    Route::get('products/{productId}/boms', [\App\Http\Controllers\Api\BomController::class, 'getByProduct']);
    Route::get('products/{productId}/active-bom', [\App\Http\Controllers\Api\BomController::class, 'getActiveBom']);

    // Write: super_admin, admin, ppic (master-data.manage)
    Route::middleware('permission:master-data.manage')->group(
        function () use ($masterData) {
            foreach ($masterData as $uri => $controller) {
                Route::apiResource($uri, $controller)->except(['index', 'show']);
            }

            // BOM Write Routes
            Route::post('boms', [\App\Http\Controllers\Api\BomController::class, 'store']);
            Route::put('boms/{id}', [\App\Http\Controllers\Api\BomController::class, 'update']);
            Route::delete('boms/{id}', [\App\Http\Controllers\Api\BomController::class, 'destroy']);
            Route::post('boms/{id}/activate', [\App\Http\Controllers\Api\BomController::class, 'activate']);
            Route::post('boms/{id}/archive', [\App\Http\Controllers\Api\BomController::class, 'archive']);
            Route::post('boms/{id}/unarchive', [\App\Http\Controllers\Api\BomController::class, 'unarchive']);
            Route::post('boms/{id}/clone', [\App\Http\Controllers\Api\BomController::class, 'clone']);
        }
    );

    // ============================================================
    // SALES
    // View   : sales, manager, admin, super_admin (sales.view)
    // Manage : sales, admin, super_admin (sales.manage)
    // Approve: manager, admin, super_admin (sales.approve)
    // ============================================================

    Route::middleware('permission:sales.view')->group(function () {
        Route::apiResource('sales-orders', SalesOrderController::class)->only(['index', 'show']);
        Route::get('sales-orders/{salesOrder}/items',       [SalesOrderController::class, 'items']);
        Route::get('sales-orders/{salesOrder}/audit-logs',  [SalesOrderController::class, 'auditLogs']);
        Route::post('sales-orders/{salesOrder}/check-stock', [SalesOrderController::class, 'checkStock']);
    });

    Route::middleware('permission:sales.manage')->group(function () {
        Route::apiResource('sales-orders', SalesOrderController::class)->except(['index', 'show']);
        Route::post('sales-orders/{salesOrder}/submit',   [SalesOrderController::class, 'submit']);
        Route::post('sales-orders/{salesOrder}/lock-bom', [SalesOrderController::class, 'lockBom']);
    });

    Route::middleware('permission:sales.approve')->group(function () {
        Route::post('sales-orders/{salesOrder}/confirm',    [SalesOrderController::class, 'confirm']);
        Route::post('sales-orders/{salesOrder}/reject',     [SalesOrderController::class, 'reject']);
    });

    Route::middleware('permission:planning.manage')->group(function () {
        Route::post('sales-orders/{salesOrder}/generate-demands', [SalesOrderController::class, 'generateDemands']);
    });

    Route::post('sales-orders/{salesOrder}/cancel', [SalesOrderController::class, 'cancel']);

    // ============================================================
    // PRODUCTION PLANNING
    // View   : ppic, production, manager, admin, super_admin (planning.view)
    // Manage : ppic, admin, super_admin (planning.manage)
    // ============================================================

    Route::middleware('permission:planning.view')->group(function () {
        Route::get('production-plans/calendar', [ProductionPlanController::class, 'calendarData']);
        Route::get('production-plans/stats',    [ProductionPlanController::class, 'dashboardStats']);
        Route::apiResource('production-demands', ProductionDemandController::class)->only(['index', 'show']);
        Route::apiResource('production-plans',   ProductionPlanController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:planning.manage')->group(function () {
        Route::apiResource('production-demands', ProductionDemandController::class)->except(['index', 'show']);
        Route::apiResource('production-plans',   ProductionPlanController::class)->except(['index', 'show']);
        
        // SIMPLIFIED Production Planning PPIC Actions
        Route::post('production-demands/{productionDemand}/schedule',          [ProductionDemandController::class, 'schedule']);
        Route::get('production-demands/{productionDemand}/available-molds',    [ProductionDemandController::class, 'availableMolds']);
        Route::get('production-demands/{productionDemand}/preview-batches',    [ProductionDemandController::class, 'previewBatches']);
        Route::post('production-demands/{productionDemand}/approve',           [ProductionDemandController::class, 'approve']);
        Route::post('production-demands/{productionDemand}/reject',            [ProductionDemandController::class, 'reject']);
    });

    // ============================================================
    // PRODUCTION BATCHES
    // View   : ppic, production, qc, manager, admin, super_admin (batch.view)
    // Manage : ppic, production, admin, super_admin (batch.manage)
    //          Includes release / start / complete actions
    // ============================================================

    Route::middleware('permission:batch.view')->group(function () {
        Route::apiResource('production-batches', ProductionBatchController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:batch.manage')->group(function () {
        Route::apiResource('production-batches', ProductionBatchController::class)->except(['index', 'show']);
        Route::post('production-batches/{batch}/start',    [ProductionBatchController::class, 'start']);
        Route::post('production-batches/{batch}/complete', [ProductionBatchController::class, 'complete']);
        Route::post('production-batches/{batch}/transition', [ProductionBatchController::class, 'transition']);
    });

    // ============================================================
    // WORK ORDERS
    // View   : ppic, production, qc, manager, admin, super_admin (work-orders.view)
    // Manage : production, admin, super_admin (work-orders.manage)
    // ============================================================

    Route::middleware('permission:work-orders.view')->group(function () {
        Route::apiResource('work-orders', WorkOrderController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:work-orders.manage')->group(function () {
        Route::apiResource('work-orders', WorkOrderController::class)->except(['index', 'show']);
    });

    // ============================================================
    // CURING — production operators (batch.manage)
    // ============================================================

    Route::middleware('permission:batch.manage')->group(function () {
        Route::apiResource('curing', CuringController::class);
    });

    // ============================================================
    // QUALITY CONTROL
    // View   : qc, manager, admin, super_admin (qc.view)
    // Manage : qc, admin, super_admin (qc.manage — create/update inspections)
    // Approve: qc, manager, admin, super_admin (qc.approve)
    // ============================================================

    Route::middleware('permission:qc.view')->group(function () {
        Route::get('qc-inspections', [QcInspectionController::class, 'index']);
        Route::get('qc-inspections/{id}', [QcInspectionController::class, 'show']);
        Route::get('qc-dashboard', [QcInspectionController::class, 'dashboard']);
    });

    Route::post('qc-inspections', [QcInspectionController::class, 'store'])->middleware('permission:qc.create');
    Route::put('qc-inspections/{id}', [QcInspectionController::class, 'update'])->middleware('permission:qc.update');
    Route::delete('qc-inspections/{id}', [QcInspectionController::class, 'destroy'])->middleware('permission:qc.delete');

    // ============================================================
    // DELIVERY
    // View   : warehouse, sales, manager, admin, super_admin (delivery.view)
    // Manage : warehouse, admin, super_admin (delivery.manage)
    // ============================================================

    Route::middleware('permission:delivery.view')->group(function () {
        Route::get('delivery-orders', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'index']);
        Route::get('delivery-orders/fifo-check', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'fifoCheck']);
        Route::get('delivery-orders/{delivery_order}', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'show']);
    });

    Route::middleware('permission:delivery.manage')->group(function () {
        Route::post('delivery-orders', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'store']);
        Route::put('delivery-orders/{delivery_order}', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'update']);
        Route::delete('delivery-orders/{delivery_order}', [\App\Http\Controllers\Api\DeliveryOrderController::class, 'destroy']);
    });

    // ============================================================
    // MATERIAL INVENTORY
    // View   : ppic, warehouse, manager, admin, super_admin (inventory.view)
    // Manage : ppic, warehouse, admin, super_admin (inventory.manage)
    // ============================================================

    Route::middleware('permission:inventory.view')->group(function () {
        Route::get('inventory', [\App\Http\Controllers\Api\InventoryController::class, 'index']);
        Route::get('material-inventory', [\App\Http\Controllers\Api\MaterialInventoryController::class, 'index']);
        Route::get('material-inventory/dashboard', [\App\Http\Controllers\Api\MaterialInventoryController::class, 'dashboard']);
    });

    Route::middleware('permission:inventory.manage')->group(function () {
        Route::post('material-inventory/adjustment', [\App\Http\Controllers\Api\MaterialInventoryController::class, 'adjustment']);
    });

    // ============================================================
    // USER MANAGEMENT — super_admin and admin only (user-access.manage)
    // ============================================================

    Route::middleware('permission:user-access.manage')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);

        // Role management
        Route::apiResource('roles', \App\Http\Controllers\Api\RoleController::class);
        Route::get('roles/{role}/permissions', [\App\Http\Controllers\Api\RolePermissionController::class, 'show']);
        Route::put('roles/{role}/permissions', [\App\Http\Controllers\Api\RolePermissionController::class, 'update']);

        // Module registry (read-only reference)
        Route::get('modules', [\App\Http\Controllers\Api\SystemModuleController::class, 'index']);
    });
});
