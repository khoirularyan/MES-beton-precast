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

Route::middleware('auth')->group(function () {

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    // Master Data - Products & Materials
    Route::apiResource('products', ProductController::class);
    Route::apiResource('materials', MaterialController::class);
    Route::apiResource('work-centers', WorkCenterController::class);

    // Sales
    Route::apiResource('sales-orders', SalesOrderController::class);
    Route::get('sales-orders/{salesOrder}/items', [SalesOrderController::class, 'items']);
    Route::post('sales-orders/{salesOrder}/confirm', [SalesOrderController::class, 'confirm']);
    Route::post('sales-orders/{salesOrder}/check-stock', [SalesOrderController::class, 'checkStock']);

    // Production Demand
    Route::apiResource('production-demands', ProductionDemandController::class);

    // Production Planning
    Route::apiResource('production-plans', ProductionPlanController::class);

    // Production Batches
    Route::apiResource('production-batches', ProductionBatchController::class);
    Route::post('production-batches/{batch}/release', [ProductionBatchController::class, 'release']);
    Route::post('production-batches/{batch}/start', [ProductionBatchController::class, 'start']);
    Route::post('production-batches/{batch}/complete', [ProductionBatchController::class, 'complete']);

    // Work Orders
    Route::apiResource('work-orders', WorkOrderController::class);

    // Curing
    Route::apiResource('curing', CuringController::class);

    // QC
    Route::apiResource('qc-inspections', QcInspectionController::class);

    // Delivery
    Route::apiResource('delivery-orders', DeliveryOrderController::class);

    // ============================================================
    // EXTENDED MASTER DATA
    // ============================================================
    Route::apiResource('suppliers', \App\Http\Controllers\Api\SupplierController::class);
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::apiResource('product-categories', \App\Http\Controllers\Api\ProductCategoryController::class);
    Route::apiResource('product-types', \App\Http\Controllers\Api\ProductTypeController::class);
    Route::apiResource('product-specs', \App\Http\Controllers\Api\ProductSpecController::class);
    Route::apiResource('concrete-grades', \App\Http\Controllers\Api\ConcreteGradeController::class);
    Route::apiResource('material-categories', \App\Http\Controllers\Api\MaterialCategoryController::class);
    Route::apiResource('molds', \App\Http\Controllers\Api\MoldController::class);
    Route::apiResource('warehouses', \App\Http\Controllers\Api\WarehouseController::class);
    // Route::apiResource('machines', \App\Http\Controllers\Api\MachineController::class); // REMOVED - Table dropped in refactor
    // Route::apiResource('employees', \App\Http\Controllers\Api\EmployeeController::class); // REMOVED - Use users instead
    Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
    Route::apiResource('shifts', \App\Http\Controllers\Api\ShiftController::class);
    Route::apiResource('batch-statuses', \App\Http\Controllers\Api\BatchStatusController::class);
    Route::apiResource('qc-parameters', \App\Http\Controllers\Api\QcParameterController::class);
    Route::apiResource('defect-categories', \App\Http\Controllers\Api\DefectCategoryController::class);
    Route::apiResource('production-statuses', \App\Http\Controllers\Api\ProductionStatusController::class);
    Route::apiResource('delivery-statuses', \App\Http\Controllers\Api\DeliveryStatusController::class);
});
