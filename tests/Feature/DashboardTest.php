<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_endpoint_returns_data(): void
    {
        $role = Role::updateOrCreate(
            ['kode' => 'ppic'],
            ['nama' => 'PPIC Staff', 'is_active' => true]
        );

        $user = User::factory()->create([
            'username' => 'ppic_test_' . uniqid(),
            'role' => 'ppic',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard');
        
        // Print the JSON response to see if there is an error or unexpected output
        fwrite(STDERR, "\n=== API RESPONSE ===\n" . json_encode($response->json(), JSON_PRETTY_PRINT) . "\n=== END ===\n");

        $response->assertStatus(200);
    }
}
