import { useEffect, useState } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { authRequestJson, useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const permissionLabels = {
  "dashboard.view": "Dashboard",
  "master-data.view": "Master Data",
  "master-bom.view": "Master BOM",
  "master-process.view": "Master Process",
  "sales.view": "Sales Order",
  "planning.view": "Production Planning",
  "work-orders.view": "Work Orders",
  "production-execution.view": "Production Execution",
  "curing.view": "Curing",
  "quality.view": "Quality Control",
  "inventory.view": "Inventory",
  "delivery.view": "Delivery",
  "reports.view": "Reports",
  "user-access.manage": "User Access",
};

export const UserAccessManagement = () => {
  const { roles, rolePermissions } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authRequestJson("/auth/users", { method: "GET" })
      .then((data) => setUsers(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const roleCount = Object.keys(roles).length;
  const activeUsers = users.filter((user) => user.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Administration</div>
        <h1 className="text-2xl font-semibold text-[#1C252E] font-display">User Access Management</h1>
        <p className="text-sm text-[#59687A]">Manage module visibility based on role and user account status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-[#EAF3FF] text-[#0A6ED1] flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1C252E]">{users.length}</div>
              <div className="text-xs text-[#59687A]">Registered users</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-[#EAF7ED] text-[#107E3E] flex items-center justify-center">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1C252E]">{activeUsers}</div>
              <div className="text-xs text-[#59687A]">Active accounts</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-[#FFF4E5] text-[#E9730C] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#1C252E]">{roleCount}</div>
              <div className="text-xs text-[#59687A]">Role RBAC</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-5 border-b border-[#DFE3E8]">
          <CardTitle className="text-base font-semibold text-[#1C252E] flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#0A6ED1]" />
            User List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#59687A] py-8">Loading users...</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium text-[#1C252E]">{user.name}</div>
                      <div className="text-xs text-[#59687A]">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role_label}</Badge>
                    </TableCell>
                    <TableCell>{user.department ?? "-"}</TableCell>
                    <TableCell>{user.plant}</TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? "bg-[#EAF7ED] text-[#107E3E] hover:bg-[#EAF7ED]" : "bg-[#FFEAEA] text-[#B00020] hover:bg-[#FFEAEA]"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-5 border-b border-[#DFE3E8]">
          <CardTitle className="text-base font-semibold text-[#1C252E] flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-[#0A6ED1]" />
            Module Permission Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid gap-4 lg:grid-cols-2">
          {Object.entries(roles).map(([role, label]) => {
            const permissions = rolePermissions[role] ?? [];
            const visiblePermissions = permissions.includes("*") ? ["Semua modul dan administrasi"] : permissions.map((permission) => permissionLabels[permission] ?? permission);
            return (
              <div key={role} className="border border-[#DFE3E8] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#1C252E]">{label}</div>
                  <Badge variant="outline">{permissions.includes("*") ? "Full Access" : `${permissions.length} permission`}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {visiblePermissions.map((permission) => (
                    <span key={permission} className="text-xs rounded bg-[#F4F6F8] px-2 py-1 text-[#59687A]">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAccessManagement;
