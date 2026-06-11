<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call all master data seeders
        $this->call([
            MasterDataSeeder::class,
            ProductSeeder::class,
            MaterialSeeder::class,
        ]);

        // Seed users
        $users = [
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'email' => 'super@admin',
                'password' => 'super',
                'role' => 'super_admin',
            ],
            [
                'name' => 'QC User',
                'username' => 'qcuser',
                'email' => 'qc@qc',
                'password' => '12345',
                'role' => 'qc',
            ],
            [
                'name' => 'Standard User',
                'username' => 'standarduser',
                'email' => 'user@user',
                'password' => '12345',
                'role' => 'production',
            ],
        ];

        User::query()
            ->whereNotIn('email', array_column($users, 'email'))
            ->update(['is_active' => false]);

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'username' => $user['username'],
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                    'plant' => 'Plant Bekasi',
                    'is_active' => true,
                ],
            );
        }

        // Seed product specs after products are created
        $this->call([
            ProductSpecSeeder::class,
        ]);
    }
}
