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
        // Call all master data seeders (RoleSeeder must run first for user role FK)
        $this->call([
            RoleSeeder::class,
            MasterDataSeeder::class,
            ProductSeeder::class,
            MaterialSeeder::class,
        ]);

        // Seed users — one per role for testing/development
        $users = [
            // Role: super_admin
            ['name' => 'Super Admin',     'username' => 'superadmin',   'email' => 'super@admin',       'password' => 'super',   'role' => 'super_admin'],
            // Role: admin
            ['name' => 'Admin MES',       'username' => 'admin',         'email' => 'admin@mes',         'password' => '12345',   'role' => 'admin'],
            // Role: manager
            ['name' => 'Plant Manager',   'username' => 'manager',       'email' => 'manager@mes',       'password' => '12345',   'role' => 'manager'],
            // Role: ppic
            ['name' => 'PPIC Staff',      'username' => 'ppicstaff',     'email' => 'ppic@mes',          'password' => '12345',   'role' => 'ppic'],
            // Role: production
            ['name' => 'Production Ops',  'username' => 'prodops',       'email' => 'production@mes',    'password' => '12345',   'role' => 'production'],
            // Role: qc
            ['name' => 'QC Inspector',    'username' => 'qcinspector',   'email' => 'qc@mes',            'password' => '12345',   'role' => 'qc'],
            // Role: warehouse
            ['name' => 'Warehouse Staff', 'username' => 'warehousestaff','email' => 'warehouse@mes',     'password' => '12345',   'role' => 'warehouse'],
            // Role: sales
            ['name' => 'Sales Staff',     'username' => 'salesstaff',    'email' => 'sales@mes',         'password' => '12345',   'role' => 'sales'],
        ];

        User::query()
            ->whereNotIn('email', array_column($users, 'email'))
            ->update(['is_active' => false]);

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name'      => $user['name'],
                    'username'  => $user['username'],
                    'password'  => Hash::make($user['password']),
                    'role'      => $user['role'],
                    'plant'     => 'Plant Bekasi',
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
