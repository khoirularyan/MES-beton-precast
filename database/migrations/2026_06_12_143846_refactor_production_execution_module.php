<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Insert Curing and adjust sequence in global.production_batch_statuses
        DB::transaction(function () {
            // First, adjust the sequence (urutan) of existing statuses
            DB::table('global.production_batch_statuses')
                ->where('status', 'QC')
                ->update(['urutan' => 5]);

            DB::table('global.production_batch_statuses')
                ->where('status', 'Finished')
                ->update(['urutan' => 6]);

            DB::table('global.production_batch_statuses')
                ->where('status', 'Delivered')
                ->update(['urutan' => 7]);

            // Insert Curing as BS-07 with urutan 4
            DB::table('global.production_batch_statuses')->insertOrIgnore([
                'kode' => 'BS-07',
                'status' => 'Curing',
                'urutan' => 4,
                'warna' => '#00BCD4',
                'deskripsi' => 'Proses perawatan beton dengan uap / curing',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        // 2. Add batch_status_id column to public.production_batches
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->foreignId('batch_status_id')
                ->nullable()
                ->after('notes')
                ->constrained('global.production_batch_statuses')
                ->nullOnDelete();
        });

        // 3. Migrate existing string statuses to batch_status_id
        DB::transaction(function () {
            $statuses = DB::table('global.production_batch_statuses')->get();
            $statusMap = $statuses->pluck('id', 'status');

            // Find batch status by name/code
            $planningId = $statusMap->get('Planning');
            $castingId = $statusMap->get('Casting');
            $qcId = $statusMap->get('QC');
            $finishedId = $statusMap->get('Finished');
            $deliveredId = $statusMap->get('Delivered');

            if ($planningId) {
                DB::table('public.production_batches')->whereIn('status', ['Planned', 'Released', 'planning', 'planned'])->update(['batch_status_id' => $planningId]);
            }
            if ($castingId) {
                DB::table('public.production_batches')->whereIn('status', ['In Progress', 'casting', 'Casting'])->update(['batch_status_id' => $castingId]);
            }
            if ($qcId) {
                DB::table('public.production_batches')->whereIn('status', ['QC Pending', 'qc', 'QC'])->update(['batch_status_id' => $qcId]);
            }
            if ($finishedId) {
                DB::table('public.production_batches')->whereIn('status', ['Completed', 'Closed', 'finished', 'Finished'])->update(['batch_status_id' => $finishedId]);
            }
            if ($deliveredId) {
                DB::table('public.production_batches')->whereIn('status', ['Delivered', 'delivered'])->update(['batch_status_id' => $deliveredId]);
            }

            // Fallback: set remaining null statuses to Planning
            if ($planningId) {
                DB::table('public.production_batches')->whereNull('batch_status_id')->update(['batch_status_id' => $planningId]);
            }
        });

        // Make batch_status_id non-nullable now that we have migrated the data
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->foreignId('batch_status_id')->nullable(false)->change();
        });

        // Drop the old string status column
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        // 4. Create public.production_batch_status_logs table
        Schema::create('public.production_batch_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')
                ->constrained('public.production_batches')
                ->onDelete('cascade');
            $table->foreignId('from_status_id')
                ->nullable()
                ->constrained('global.production_batch_statuses')
                ->nullOnDelete();
            $table->foreignId('to_status_id')
                ->constrained('global.production_batch_statuses')
                ->restrictOnDelete();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('global.production_users')
                ->nullOnDelete();
            $table->timestamp('changed_at')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Cleanup unused duplicate tables in public schema
        Schema::dropIfExists('public.production_bom_items');
        Schema::dropIfExists('public.production_bom_headers');
        Schema::dropIfExists('public.production_customers');
        Schema::dropIfExists('public.production_materials');
        Schema::dropIfExists('public.production_products');
        Schema::dropIfExists('public.production_suppliers');
        Schema::dropIfExists('public.production_users');
    }

    public function down(): void
    {
        // Recreate the status column
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->string('status', 30)->default('Planned');
        });

        // Rollback data if possible
        DB::transaction(function () {
            $statuses = DB::table('global.production_batch_statuses')->get()->keyBy('id');
            $batches = DB::table('public.production_batches')->get();
            foreach ($batches as $b) {
                if (isset($statuses[$b->batch_status_id])) {
                    $statusName = $statuses[$b->batch_status_id]->status;
                    $strStatus = 'Planned';
                    if ($statusName === 'Casting') $strStatus = 'In Progress';
                    if ($statusName === 'QC') $strStatus = 'QC Pending';
                    if ($statusName === 'Finished') $strStatus = 'Completed';
                    if ($statusName === 'Delivered') $strStatus = 'Delivered';

                    DB::table('public.production_batches')->where('id', $b->id)->update(['status' => $strStatus]);
                }
            }
        });

        // Drop the foreign key and column
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->dropForeign(['batch_status_id']);
            $table->dropColumn('batch_status_id');
        });

        // Drop the logs table
        Schema::dropIfExists('public.production_batch_status_logs');
    }
};
