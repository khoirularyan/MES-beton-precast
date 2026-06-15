<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SystemModule;
use App\Support\Rbac;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed system roles and their permissions from the Rbac defaults,
     * then seed the system modules registry.
     */
    public function run(): void
    {
        // ─── 1. Seed system modules ────────────────────────────────────────

        $modules = [
            ['code' => 'dashboard',          'name' => 'Dashboard',                       'description' => 'Dashboard & KPI overview'],
            ['code' => 'master_data',        'name' => 'Master Data',                     'description' => 'Product, material, customer master data'],
            ['code' => 'master_bom',         'name' => 'Master BOM',                      'description' => 'Bill of materials management'],
            ['code' => 'master_process',     'name' => 'Master Process',                  'description' => 'Production process templates'],
            ['code' => 'master_products',    'name' => 'Master Products & Specs',         'description' => 'Products, specifications, categories, and types'],
            ['code' => 'master_materials',   'name' => 'Master Materials',                'description' => 'Materials and material categories'],
            ['code' => 'master_molds',       'name' => 'Master Molds',                    'description' => 'Molds management'],
            ['code' => 'master_customers',   'name' => 'Master Customers',                'description' => 'Customers management'],
            ['code' => 'master_suppliers',   'name' => 'Master Suppliers',                'description' => 'Suppliers management'],
            ['code' => 'master_warehouses',  'name' => 'Master Warehouses',               'description' => 'Warehouses management'],
            ['code' => 'master_shifts',      'name' => 'Master Shifts',                   'description' => 'Shifts management'],
            ['code' => 'master_qc',          'name' => 'Master QC & Defects',             'description' => 'QC parameters and defect categories'],
            ['code' => 'master_workcenters', 'name' => 'Master Work Centers',             'description' => 'Work centers management'],
            ['code' => 'sales_order',        'name' => 'Sales Order',                     'description' => 'Sales order management'],
            ['code' => 'planning',           'name' => 'Production Planning',             'description' => 'Demand & production planning'],
            ['code' => 'batch',              'name' => 'Production Batch',                'description' => 'Batch release & execution tracking'],
            ['code' => 'work_orders',        'name' => 'Work Orders',                     'description' => 'Work order management'],
            ['code' => 'production_exec',    'name' => 'Production Execution',            'description' => 'Production execution & lines'],
            ['code' => 'curing',             'name' => 'Curing',                          'description' => 'Curing process tracking'],
            ['code' => 'qc',                 'name' => 'Quality Control',                 'description' => 'QC inspections & parameters'],
            ['code' => 'inventory',          'name' => 'Inventory',                       'description' => 'Stock & warehouse management'],
            ['code' => 'delivery',           'name' => 'Delivery',                        'description' => 'Delivery order management'],
            ['code' => 'reports',            'name' => 'Reports',                         'description' => 'Analytics & reporting'],
            ['code' => 'user_access',        'name' => 'User Access',                     'description' => 'User & role management'],
        ];

        $moduleMap = []; // code → id
        foreach ($modules as $m) {
            $mod = SystemModule::updateOrCreate(['code' => $m['code']], $m);
            $moduleMap[$m['code']] = $mod->id;
        }

        // ─── 2. Seed system roles from Rbac defaults ──────────────────────

        // Map old permission strings → new module-code + flag columns
        $permissionToModuleFlags = [
            'dashboard.view'            => ['module' => 'dashboard',          'flags' => ['can_view' => true]],
            'master-data.view'          => ['module' => 'master_data',        'flags' => ['can_view' => true]],
            'master-data.manage'        => ['module' => 'master_data',        'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-bom.view'           => ['module' => 'master_bom',         'flags' => ['can_view' => true]],
            'master-bom.manage'         => ['module' => 'master_bom',         'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-products.view'      => ['module' => 'master_products',    'flags' => ['can_view' => true]],
            'master-products.manage'    => ['module' => 'master_products',    'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-materials.view'     => ['module' => 'master_materials',   'flags' => ['can_view' => true]],
            'master-materials.manage'   => ['module' => 'master_materials',   'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-molds.view'         => ['module' => 'master_molds',       'flags' => ['can_view' => true]],
            'master-molds.manage'       => ['module' => 'master_molds',       'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-customers.view'     => ['module' => 'master_customers',   'flags' => ['can_view' => true]],
            'master-customers.manage'   => ['module' => 'master_customers',   'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-suppliers.view'     => ['module' => 'master_suppliers',   'flags' => ['can_view' => true]],
            'master-suppliers.manage'   => ['module' => 'master_suppliers',   'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-warehouses.view'    => ['module' => 'master_warehouses',  'flags' => ['can_view' => true]],
            'master-warehouses.manage'  => ['module' => 'master_warehouses',  'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-shifts.view'        => ['module' => 'master_shifts',      'flags' => ['can_view' => true]],
            'master-shifts.manage'      => ['module' => 'master_shifts',      'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-qc.view'            => ['module' => 'master_qc',          'flags' => ['can_view' => true]],
            'master-qc.manage'          => ['module' => 'master_qc',          'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'master-workcenters.view'   => ['module' => 'master_workcenters', 'flags' => ['can_view' => true]],
            'master-workcenters.manage' => ['module' => 'master_workcenters', 'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'sales.view'                => ['module' => 'sales_order',        'flags' => ['can_view' => true]],
            'sales.manage'              => ['module' => 'sales_order',        'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'sales.approve'             => ['module' => 'sales_order',        'flags' => ['can_approve' => true]],
            'planning.view'             => ['module' => 'planning',           'flags' => ['can_view' => true]],
            'planning.manage'           => ['module' => 'planning',           'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'batch.view'                => ['module' => 'batch',              'flags' => ['can_view' => true]],
            'batch.manage'              => ['module' => 'batch',              'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'work-orders.view'          => ['module' => 'work_orders',        'flags' => ['can_view' => true]],
            'work-orders.manage'        => ['module' => 'work_orders',        'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'qc.view'                   => ['module' => 'qc',                 'flags' => ['can_view' => true]],
            'qc.manage'                 => ['module' => 'qc',                 'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'qc.approve'                => ['module' => 'qc',                 'flags' => ['can_approve' => true]],
            'inventory.view'            => ['module' => 'inventory',          'flags' => ['can_view' => true]],
            'inventory.manage'          => ['module' => 'inventory',          'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'delivery.view'             => ['module' => 'delivery',           'flags' => ['can_view' => true]],
            'delivery.manage'           => ['module' => 'delivery',           'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
            'delivery.approve'          => ['module' => 'delivery',           'flags' => ['can_approve' => true]],
            'reports.view'              => ['module' => 'reports',            'flags' => ['can_view' => true]],
            'user-access.manage'        => ['module' => 'user_access',        'flags' => ['can_view' => true, 'can_create' => true, 'can_update' => true, 'can_delete' => true]],
        ];

        foreach (Rbac::ROLES as $kode => $nama) {
            $role = Role::updateOrCreate(
                ['kode' => $kode],
                [
                    'nama'      => $nama,
                    'deskripsi' => "System role: {$nama}",
                    'is_system' => true,
                    'is_active' => true,
                ]
            );

            $oldPermissions = Rbac::PERMISSIONS[$kode] ?? [];

            // '*' means full access — grant all modules all flags
            if (in_array('*', $oldPermissions, true)) {
                foreach ($moduleMap as $moduleCode => $moduleId) {
                    RolePermission::updateOrCreate(
                        ['role_id' => $role->id, 'module_id' => $moduleId],
                        [
                            'can_view'    => true,
                            'can_create'  => true,
                            'can_update'  => true,
                            'can_delete'  => true,
                            'can_approve' => true,
                        ]
                    );
                }
                continue;
            }

            // Build aggregated module flags from individual permissions
            $aggregated = []; // moduleCode → flags[]
            foreach ($oldPermissions as $permString) {
                $map = $permissionToModuleFlags[$permString] ?? null;
                if (! $map) continue;

                $mCode = $map['module'];
                if (! isset($aggregated[$mCode])) {
                    $aggregated[$mCode] = ['can_view' => false, 'can_create' => false, 'can_update' => false, 'can_delete' => false, 'can_approve' => false];
                }
                foreach ($map['flags'] as $flag => $val) {
                    if ($val) {
                        $aggregated[$mCode][$flag] = true;
                    }
                }
            }

            foreach ($aggregated as $mCode => $flags) {
                $moduleId = $moduleMap[$mCode] ?? null;
                if (! $moduleId) continue;

                RolePermission::updateOrCreate(
                    ['role_id' => $role->id, 'module_id' => $moduleId],
                    $flags
                );
            }
        }
    }
}
