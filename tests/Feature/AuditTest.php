<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditTest extends TestCase
{
    public function test_audit_database_tables()
    {
        // Get all tables in both schemas
        $results = DB::select("
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'global') 
              AND table_name NOT LIKE 'pg_%' 
              AND table_name NOT LIKE 'sql_%' 
            ORDER BY table_name, table_schema
        ");

        $schemas = [];
        foreach ($results as $row) {
            $schemas[$row->table_name][] = $row->table_schema;
        }

        $report = [];
        $report[] = "=== Database Tables Audit & Schema Duplication Report ===";
        $report[] = "Generated at: " . now()->toDateTimeString();
        $report[] = "\n--- 1. Schema Duplication Analysis ---";

        foreach ($schemas as $tableName => $tableSchemas) {
            if (count($tableSchemas) > 1) {
                // Table exists in both schemas! Let's count rows in both.
                $publicCount = 0;
                $globalCount = 0;

                try {
                    $publicCount = DB::table("public.{$tableName}")->count();
                } catch (\Exception $e) {
                    $publicCount = 'Error: ' . $e->getMessage();
                }

                try {
                    $globalCount = DB::table("global.{$tableName}")->count();
                } catch (\Exception $e) {
                    $globalCount = 'Error: ' . $e->getMessage();
                }

                $report[] = "Table: {$tableName}";
                $report[] = "  - public.{$tableName} row count: {$publicCount}";
                $report[] = "  - global.{$tableName} row count: {$globalCount}";
                
                if ($publicCount === 0 && $globalCount > 0) {
                    $report[] = "  => RECOMMENDATION: Drop public.{$tableName} (unused duplicate).";
                } elseif ($globalCount === 0 && $publicCount > 0) {
                    $report[] = "  => RECOMMENDATION: Drop global.{$tableName} (public schema has data).";
                } elseif ($publicCount === 0 && $globalCount === 0) {
                    $report[] = "  => RECOMMENDATION: Both are empty, but global.{$tableName} is preferred for master data.";
                } else {
                    $report[] = "  => WARNING: Both schemas have data! Needs migration/merge.";
                }
                $report[] = "";
            }
        }

        $report[] = "\n--- 2. Single-Schema Tables ---";
        foreach ($schemas as $tableName => $tableSchemas) {
            if (count($tableSchemas) === 1) {
                $schema = $tableSchemas[0];
                try {
                    $count = DB::table("{$schema}.{$tableName}")->count();
                } catch (\Exception $e) {
                    $count = 'Error: ' . $e->getMessage();
                }
                $report[] = "{$schema}.{$tableName} (Row count: {$count})";
            }
        }

        // Write the report file
        file_put_contents('c:/archlabs/app/MES-beton-precast/database_tables_audit.txt', implode("\n", $report));

        $this->assertTrue(true);
    }
}
