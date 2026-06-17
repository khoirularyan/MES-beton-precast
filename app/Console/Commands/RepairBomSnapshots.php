<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RepairBomSnapshots extends Command
{
    protected $signature = 'costing:repair-bom-snapshots {--dry-run : Simulate the repair process without saving changes}';
    protected $description = 'Repairs missing bom_header_id references on production batches and sales order items';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $executingUser = get_current_user() ?: 'system';
        $timestamp = now()->toDateTimeString();

        $batches = DB::table('public.production_batches')
            ->whereNull('bom_header_id')
            ->whereNull('deleted_at')
            ->get();

        $soItems = DB::table('public.production_sales_order_items')
            ->whereNull('bom_header_id')
            ->get();

        // Load active BOMs
        $activeBoms = DB::table('global.production_bom_headers')
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->keyBy('product_id');

        $repairedBatches = [];
        $repairedSoItems = [];
        $unresolvedBatches = [];
        $unresolvedSoItems = [];

        if ($dryRun) {
            $this->info("=== Dry Run Mode: Simulating Repair ===");
            $this->info("Would Repair:");
        }

        foreach ($batches as $batch) {
            $bom = $activeBoms->get($batch->product_id);
            if ($bom) {
                if ($dryRun) {
                    $this->line("Batch #{$batch->id} (Product #{$batch->product_id}) -> Would assign BOM V{$bom->version}");
                } else {
                    DB::table('public.production_batches')
                        ->where('id', $batch->id)
                        ->update(['bom_header_id' => $bom->id]);
                }
                $repairedBatches[] = $batch->id;
            } else {
                if ($dryRun) {
                    $this->error("Batch #{$batch->id} (Product #{$batch->product_id}) -> No active BOM found!");
                }
                $unresolvedBatches[] = $batch->id;
            }
        }

        foreach ($soItems as $item) {
            $bom = $activeBoms->get($item->product_id);
            if ($bom) {
                if ($dryRun) {
                    $this->line("SO Item #{$item->id} (Product #{$item->product_id}) -> Would assign BOM V{$bom->version}");
                } else {
                    DB::table('public.production_sales_order_items')
                        ->where('id', $item->id)
                        ->update(['bom_header_id' => $bom->id]);
                }
                $repairedSoItems[] = $item->id;
            } else {
                if ($dryRun) {
                    $this->error("SO Item #{$item->id} (Product #{$item->product_id}) -> No active BOM found!");
                }
                $unresolvedSoItems[] = $item->id;
            }
        }

        $totalCandidates = count($batches) + count($soItems);

        if ($dryRun) {
            $this->line("");
            $this->info("Total Candidates: {$totalCandidates}");
        } else {
            $this->info("Batch Repaired: " . count($repairedBatches));
            $this->info("SO Item Repaired: " . count($repairedSoItems));
            $this->info("Unresolved: " . (count($unresolvedBatches) + count($unresolvedSoItems)));

            // Write custom audit log
            $logPath = storage_path('logs/costing-repair.log');
            $logData = [
                'timestamp' => $timestamp,
                'executing_user' => $executingUser,
                'repaired_batches' => $repairedBatches,
                'repaired_so_items' => $repairedSoItems,
                'unresolved_batches' => $unresolvedBatches,
                'unresolved_so_items' => $unresolvedSoItems
            ];
            file_put_contents($logPath, json_encode($logData) . PHP_EOL, FILE_APPEND);
        }

        return 0;
    }
}
