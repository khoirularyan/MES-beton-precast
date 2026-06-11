import { useEffect, useState, useCallback } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck, UserCog, UsersRound, Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import { authRequestJson, useAuth } from "@/lib/auth";
import { roleApi, moduleApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const UserAccessManagement = () => {
  const { roles, rolePermissions } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Users tab ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "users") return;
    authRequestJson("/auth/users", { method: "GET" })
      .then((data) => setUsers(data.data ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  const roleCount = Object.keys(roles).length;
  const activeUsers = users.filter((user) => user.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wider text-[#59687A] font-semibold">Administration</div>
        <h1 className="text-2xl font-semibold text-[#1C252E] font-display">User Access Management</h1>
        <p className="text-sm text-[#59687A]">Manage roles, permissions, and user account assignments.</p>
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
              <div className="text-xs text-[#59687A]">Roles defined</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto">
          <TabsTrigger value="users" className="text-xs h-8">Users</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs h-8">Roles</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs h-8">Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserList users={users} loading={loading} />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RoleManager />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <PermissionMatrix roles={roles} rolePermissions={rolePermissions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAccessManagement;

// ─── User List Sub-component ────────────────────────────────────────────────
const UserList = ({ users, loading }) => (
  <Card className="rounded-lg shadow-sm">
    <CardHeader className="p-5 border-b border-[#DFE3E8]">
      <CardTitle className="text-base font-semibold text-[#1C252E] flex items-center gap-2">
        <UserCog className="w-4 h-4 text-[#0A6ED1]" />
        Registered Users
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Username</TableHead>
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
                <TableCell className="font-mono text-xs text-[#59687A]">{user.username ?? "-"}</TableCell>
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
);

// ─── Role Manager Sub-component ─────────────────────────────────────────────
const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState({ kode: "", nama: "", deskripsi: "" });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roleApi.getAll();
      setRoles(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newRole.kode || !newRole.nama) return toast.error("Kode and Nama are required");
    try {
      await roleApi.create(newRole);
      toast.success("Role created");
      setNewRole({ kode: "", nama: "", deskripsi: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create role");
    }
  };

  const handleUpdate = async (id) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    try {
      await roleApi.update(id, { nama: role.nama, deskripsi: role.deskripsi });
      toast.success("Role updated");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role? Users assigned to it will be moved to 'Sales'.")) return;
    try {
      await roleApi.delete(id);
      toast.success("Role deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete this role");
    }
  };

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-5 border-b border-[#DFE3E8]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#1C252E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0A6ED1]" />
            Role Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Kode (snake_case)"
              value={newRole.kode}
              onChange={(e) => setNewRole({ ...newRole, kode: e.target.value })}
              className="h-8 text-xs w-32"
            />
            <Input
              placeholder="Nama"
              value={newRole.nama}
              onChange={(e) => setNewRole({ ...newRole, nama: e.target.value })}
              className="h-8 text-xs w-32"
            />
            <Input
              placeholder="Deskripsi"
              value={newRole.deskripsi}
              onChange={(e) => setNewRole({ ...newRole, deskripsi: e.target.value })}
              className="h-8 text-xs w-40"
            />
            <Button size="sm" className="h-8 text-xs gap-1 bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleCreate}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#59687A] py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Loading...
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-mono text-xs text-[#0A6ED1] font-medium">{role.kode}</TableCell>
                  <TableCell>
                    {editingId === role.id ? (
                      <Input
                        value={role.nama}
                        onChange={(e) => setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, nama: e.target.value } : r)))}
                        className="h-7 text-xs"
                      />
                    ) : (
                      <span className="font-medium">{role.nama}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === role.id ? (
                      <Input
                        value={role.deskripsi ?? ""}
                        onChange={(e) => setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, deskripsi: e.target.value } : r)))}
                        className="h-7 text-xs"
                      />
                    ) : (
                      <span className="text-[#59687A] text-xs">{role.deskripsi ?? "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_system ? "outline" : "secondary"}>
                      {role.is_system ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={role.is_active ? "bg-[#EAF7ED] text-[#107E3E]" : "bg-[#FFEAEA] text-[#B00020]"}>
                      {role.is_active ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingId === role.id ? (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#107E3E]" onClick={() => handleUpdate(role.id)}>
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#59687A]" onClick={() => setEditingId(null)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#0A6ED1]" onClick={() => setEditingId(role.id)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#B00020]"
                            disabled={role.is_system}
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ─── Editable Permission Matrix Sub-component ───────────────────────────────
const PermissionMatrix = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [matrix, setMatrix] = useState({});  // roleId -> { moduleId -> { can_view, ... } }
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, modulesRes] = await Promise.all([
        roleApi.getAll(),
        moduleApi.getAll(),
      ]);
      setRoles(rolesRes.data);
      setModules(modulesRes.data);

      // Load permission matrix for all roles
      const m = {};
      await Promise.all(
        rolesRes.data.map(async (role) => {
          try {
            const permRes = await roleApi.getPermissions(role.id);
            const byModule = {};
            (permRes.data.modules || []).forEach((p) => {
              byModule[p.module_id] = {
                can_view: p.can_view, can_create: p.can_create,
                can_update: p.can_update, can_delete: p.can_delete, can_approve: p.can_approve,
              };
            });
            m[role.id] = byModule;
          } catch {
            m[role.id] = {};
          }
        })
      );
      setMatrix(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggle = (moduleId, flag) => {
    if (!selectedRoleId) return;
    setMatrix((prev) => {
      const rolePerms = { ...(prev[selectedRoleId] || {}) };
      const modPerms = { ...(rolePerms[moduleId] || { can_view: false, can_create: false, can_update: false, can_delete: false, can_approve: false }) };
      modPerms[flag] = !modPerms[flag];
      rolePerms[moduleId] = modPerms;
      return { ...prev, [selectedRoleId]: rolePerms };
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const permissions = Object.entries(matrix[selectedRoleId] || {}).map(([moduleId, flags]) => ({
        module_id: parseInt(moduleId),
        ...flags,
      }));
      await roleApi.updatePermissions(selectedRoleId, { permissions });
      toast.success("Permission matrix saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const flags = [
    { key: "can_view",    label: "View" },
    { key: "can_create",  label: "Create" },
    { key: "can_update",  label: "Update" },
    { key: "can_delete",  label: "Delete" },
    { key: "can_approve", label: "Approve" },
  ];

  const currentPerms = selectedRoleId ? (matrix[selectedRoleId] || {}) : {};

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-5 border-b border-[#DFE3E8]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#1C252E] flex items-center gap-2">
            <LockKeyhole className="w-4 h-4 text-[#0A6ED1]" />
            Permission Matrix
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedRoleId ?? ""}
              onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
              className="h-8 text-xs border border-[#DFE3E8] rounded px-2 bg-white"
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.nama} ({r.kode})</option>
              ))}
            </select>
            <Button
              size="sm"
              className="h-8 text-xs gap-1 bg-[#107E3E] hover:bg-[#0d6b33]"
              disabled={!selectedRoleId || saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-[#59687A]"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Loading...</div>
        ) : !selectedRoleId ? (
          <div className="p-12 text-center text-[#59687A]">Select a role above to view and edit its permissions.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Module</TableHead>
                  {flags.map((f) => (
                    <TableHead key={f.key} className="text-center w-20">{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => {
                  const perm = currentPerms[mod.id] || {};
                  return (
                    <TableRow key={mod.id}>
                      <TableCell>
                        <div className="font-medium text-xs">{mod.name}</div>
                        <div className="text-[10px] text-[#59687A] font-mono">{mod.code}</div>
                      </TableCell>
                      {flags.map((f) => (
                        <TableCell key={f.key} className="text-center">
                          <button
                            type="button"
                            onClick={() => toggle(mod.id, f.key)}
                            className={`w-7 h-7 rounded border transition-colors ${
                              perm[f.key]
                                ? "bg-[#0A6ED1] border-[#0A6ED1] text-white"
                                : "bg-white border-[#DFE3E8] text-transparent hover:border-[#0A6ED1]"
                            }`}
                          >
                            ✓
                          </button>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
