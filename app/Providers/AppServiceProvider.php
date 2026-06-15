<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use App\Models\ProductionBatch;
use App\Observers\ProductionBatchObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::useManifestFilename('.vite/manifest.json');
        ProductionBatch::observe(ProductionBatchObserver::class);

        $masterDataModels = [
            \App\Models\Product::class,
            \App\Models\ProductCategory::class,
            \App\Models\ProductType::class,
            \App\Models\ProductSpec::class,
            \App\Models\ConcreteGrade::class,
            \App\Models\Material::class,
            \App\Models\MaterialCategory::class,
            \App\Models\Mold::class,
            \App\Models\Customer::class,
            \App\Models\Supplier::class,
            \App\Models\Warehouse::class,
            \App\Models\Shift::class,
            \App\Models\QcParameter::class,
            \App\Models\DefectCategory::class,
            \App\Models\WorkCenter::class,
            \App\Models\BatchStatus::class,
            \App\Models\ProductionStatus::class,
            \App\Models\DeliveryStatus::class,
            \App\Models\Employee::class,
            \App\Models\Machine::class,
        ];

        foreach ($masterDataModels as $model) {
            $model::observe(\App\Observers\MasterDataObserver::class);
        }
    }
}
