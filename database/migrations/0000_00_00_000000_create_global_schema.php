<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Creates the 'global' schema for master data & RBAC tables.
 * Must run before any global.* table migrations.
 *
 * Schema layout:
 *   global → master data (products, materials, customers, suppliers, BOM, etc.) + RBAC
 *   public → transactional data (orders, batches, curing, QC, inventory, delivery, etc.)
 */
return new class extends Migration {
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS "global"');
    }

    public function down(): void
    {
        DB::statement('DROP SCHEMA IF EXISTS "global" CASCADE');
    }
};
