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
    }
}
