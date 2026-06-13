<?php

use Illuminate\Database\Migrations\Migration;

/**
 * This migration is now a no-op.
 * Tables are created directly with their final names in each migration.
 * Kept for historical compatibility with migration tracking.
 */
return new class extends Migration {
    public function up(): void
    {
        // No-op: tables are created with correct names from the start
    }

    public function down(): void
    {
        // No-op
    }
};
