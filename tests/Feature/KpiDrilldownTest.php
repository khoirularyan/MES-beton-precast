<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class KpiDrilldownTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['kode' => 'admin'], ['nama' => 'Admin', 'is_active' => true]);

        $this->adminUser = User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => 'admin',
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);
    }

    public function test_kpi_drilldown_returns_valid_structure_for_all_kpi_types(): void
    {
        $kpis = [
            'active-batch',
            'kpi-curing',
            'mold-utilization',
            'kpi-mold',
            'overdue-batch',
            'kpi-qc',
            'production-output',
            'kpi-realisasi',
            'qc',
            'kpi-qc-pass',
            'revenue',
            'kpi-revenue-month',
            'cost',
            'kpi-cost-month-fin',
            'margin',
            'kpi-margin-pct',
            'unsupported-kpi-key'
        ];

        foreach ($kpis as $kpi) {
            $response = $this->actingAs($this->adminUser)
                ->getJson("/api/dashboard/kpi-drilldown/{$kpi}");

            $response->assertStatus(200);
            $response->assertJsonStructure([
                'current_value',
                'formula',
                'source',
                'trend',
                'breakdown',
                'metadata' => [
                    'last_updated',
                    'confidence',
                    'source_type',
                ]
            ]);
        }
    }
}
