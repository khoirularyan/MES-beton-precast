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
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'super@admin',
                'password' => 'super',
                'role' => 'super_admin',
                'department' => 'System Administration',
            ],
            [
                'name' => 'QC User',
                'email' => 'qc@qc',
                'password' => '12345',
                'role' => 'qc',
                'department' => 'Quality',
            ],
            [
                'name' => 'Standard User',
                'email' => 'user@user',
                'password' => '12345',
                'role' => 'user',
                'department' => 'Operations',
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
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'plant' => 'Plant Bekasi',
                    'is_active' => true,
                ],
            );
        }
    }
}
