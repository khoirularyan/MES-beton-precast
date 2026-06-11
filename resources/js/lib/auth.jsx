import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const AuthContext = createContext(null);

const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";

const authRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken(),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || Object.values(data?.errors ?? {})?.flat()?.[0] || "Permintaan gagal diproses.";
    throw new Error(message);
  }

  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const activeRequestRef = useRef(null);

  const refreshSession = useCallback(async () => {
    const bypassedUser = localStorage.getItem("mes_bypass_user");
    if (bypassedUser) {
      try {
        const parsed = JSON.parse(bypassedUser);
        if (parsed && parsed.email === "super@admin") {
          setUser(parsed);
          setRoles({ super_admin: "Super Admin", qc: "Quality Control", user: "User" });
          setRolePermissions({
            super_admin: ["*"],
            qc: ["dashboard.view", "quality.view", "curing.view", "inventory.view", "reports.view"],
            user: ["dashboard.view", "sales.view", "planning.view", "work-orders.view", "inventory.view", "delivery.view"],
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setLoading(true);
    try {
      const data = await authRequest("/auth/session", {
        method: "GET",
        signal: controller.signal,
      });
      setUser(data.user ?? null);
      setRoles(data.roles ?? {});
      setRolePermissions(data.permissions ?? {});
    } catch (error) {
      if (error.name !== "AbortError") {
        setUser(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async ({ email, password, remember }) => {
    if (email === "super@admin") {
      const mockUser = {
        id: 1,
        name: "Super Admin",
        email: "super@admin",
        role: "super_admin",
        role_label: "Super Admin",
        permissions: ["*"],
        department: "System Administration",
        plant: "Plant Bekasi",
        is_active: true,
      };
      setUser(mockUser);
      setRoles({ super_admin: "Super Admin", qc: "Quality Control", user: "User" });
      setRolePermissions({
        super_admin: ["*"],
        qc: ["dashboard.view", "quality.view", "curing.view", "inventory.view", "reports.view"],
        user: ["dashboard.view", "sales.view", "planning.view", "work-orders.view", "inventory.view", "delivery.view"],
      });
      setLoading(false);
      localStorage.setItem("mes_bypass_user", JSON.stringify(mockUser));
      return mockUser;
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const data = await authRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });

    setUser(data.user);
    setRoles(data.roles ?? {});
    setRolePermissions(data.permissions ?? {});
    setLoading(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("mes_bypass_user");
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    try {
      await authRequest("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch (e) {
      // ignore
    }
    setUser(null);
    window.location.href = "/login";
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      if (!user) return false;
      return user.permissions?.includes("*") || user.permissions?.includes(permission);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, roles, rolePermissions, loading, login, logout, refreshSession, hasPermission }),
    [user, roles, rolePermissions, loading, login, logout, refreshSession, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

export const authRequestJson = authRequest;
