<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. public.production_batches
        Schema::table('public.production_batches', function (Blueprint $table) {
            foreach (['batch_status_id', 'product_id', 'mold_id', 'work_center_id', 'sales_order_id', 'production_plan_id', 'demand_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_batches', $col)) {
                    $table->index($col);
                }
            }
        });

        // 2. public.production_qc_inspections
        Schema::table('public.production_qc_inspections', function (Blueprint $table) {
            foreach (['production_batch_id', 'product_id', 'inspector_id', 'inspection_date', 'tanggal'] as $col) {
                if (Schema::hasColumn('public.production_qc_inspections', $col)) {
                    $table->index($col);
                }
            }
        });

        // 3. public.production_qc_defects
        Schema::table('public.production_qc_defects', function (Blueprint $table) {
            foreach (['inspection_id', 'defect_category_id'] as $col) {
                if (Schema::hasColumn('public.production_qc_defects', $col)) {
                    $table->index($col);
                }
            }
        });

        // 4. public.production_qc_parameter_values
        Schema::table('public.production_qc_parameter_values', function (Blueprint $table) {
            foreach (['inspection_id', 'qc_parameter_id'] as $col) {
                if (Schema::hasColumn('public.production_qc_parameter_values', $col)) {
                    $table->index($col);
                }
            }
        });

        // 5. public.production_sales_order_items
        Schema::table('public.production_sales_order_items', function (Blueprint $table) {
            foreach (['sales_order_id', 'product_id'] as $col) {
                if (Schema::hasColumn('public.production_sales_order_items', $col)) {
                    $table->index($col);
                }
            }
        });

        // 6. public.production_sales_orders
        Schema::table('public.production_sales_orders', function (Blueprint $table) {
            foreach (['customer_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_sales_orders', $col)) {
                    $table->index($col);
                }
            }
        });

        // 7. public.production_delivery_orders
        Schema::table('public.production_delivery_orders', function (Blueprint $table) {
            foreach (['sales_order_id', 'customer_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_delivery_orders', $col)) {
                    $table->index($col);
                }
            }
        });

        // 8. public.production_inventory_batches
        Schema::table('public.production_inventory_batches', function (Blueprint $table) {
            foreach (['production_batch_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_inventory_batches', $col)) {
                    $table->index($col);
                }
            }
        });

        // 9. public.production_demands
        Schema::table('public.production_demands', function (Blueprint $table) {
            foreach (['sales_order_id', 'sales_order_item_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_demands', $col)) {
                    $table->index($col);
                }
            }
        });

        // 10. public.production_plans
        Schema::table('public.production_plans', function (Blueprint $table) {
            foreach (['work_center_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('public.production_plans', $col)) {
                    $table->index($col);
                }
            }
        });

        // 11. global.production_products
        Schema::table('global.production_products', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_products', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 12. global.production_materials
        Schema::table('global.production_materials', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_materials', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 13. global.production_suppliers
        Schema::table('global.production_suppliers', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_suppliers', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 14. global.production_molds
        Schema::table('global.production_molds', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_molds', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 15. global.production_work_centers
        Schema::table('global.production_work_centers', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_work_centers', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 16. global.production_bom_headers
        Schema::table('global.production_bom_headers', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_bom_headers', 'deleted_at')) {
                $table->index('deleted_at');
            }
        });

        // 17. global.production_bom_items
        Schema::table('global.production_bom_items', function (Blueprint $table) {
            foreach (['bom_header_id', 'material_id', 'deleted_at'] as $col) {
                if (Schema::hasColumn('global.production_bom_items', $col)) {
                    $table->index($col);
                }
            }
        });
    }

    public function down(): void
    {
        // Safely drop indexes using try-catch blocks
        $tables = [
            'public.production_batches' => ['batch_status_id', 'product_id', 'mold_id', 'work_center_id', 'sales_order_id', 'production_plan_id', 'demand_id', 'deleted_at'],
            'public.production_qc_inspections' => ['production_batch_id', 'product_id', 'inspector_id', 'inspection_date', 'tanggal'],
            'public.production_qc_defects' => ['inspection_id', 'defect_category_id'],
            'public.production_qc_parameter_values' => ['inspection_id', 'qc_parameter_id'],
            'public.production_sales_order_items' => ['sales_order_id', 'product_id'],
            'public.production_sales_orders' => ['customer_id', 'deleted_at'],
            'public.production_delivery_orders' => ['sales_order_id', 'customer_id', 'deleted_at'],
            'public.production_inventory_batches' => ['production_batch_id', 'deleted_at'],
            'public.production_demands' => ['sales_order_id', 'sales_order_item_id', 'deleted_at'],
            'public.production_plans' => ['work_center_id', 'deleted_at'],
            'global.production_products' => ['deleted_at'],
            'global.production_materials' => ['deleted_at'],
            'global.production_suppliers' => ['deleted_at'],
            'global.production_molds' => ['deleted_at'],
            'global.production_work_centers' => ['deleted_at'],
            'global.production_bom_headers' => ['deleted_at'],
            'global.production_bom_items' => ['bom_header_id', 'material_id', 'deleted_at']
        ];

        foreach ($tables as $tableName => $cols) {
            try {
                Schema::table($tableName, function (Blueprint $table) use ($cols) {
                    foreach ($cols as $col) {
                        try {
                            $table->dropIndex([$col]);
                        } catch (\Exception $inner) {}
                    }
                });
            } catch (\Exception $e) {}
        }
    }
};
