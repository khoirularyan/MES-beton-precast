<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'users' => 'production_users',
        'password_reset_tokens' => 'production_password_reset_tokens',
        'sessions' => 'production_sessions',
        'cache' => 'production_cache',
        'cache_locks' => 'production_cache_locks',
        'jobs' => 'production_jobs',
        'job_batches' => 'production_job_batches',
        'failed_jobs' => 'production_failed_jobs',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (self::TABLES as $from => $to) {
            if (Schema::hasTable($from) && ! Schema::hasTable($to)) {
                Schema::rename($from, $to);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (array_reverse(self::TABLES) as $from => $to) {
            if (Schema::hasTable($to) && ! Schema::hasTable($from)) {
                Schema::rename($to, $from);
            }
        }
    }
};
