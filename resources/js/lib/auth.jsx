import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authRequest("/auth/session", { method: "GET" });
      setUser(data.user);
      setRoles(data.roles ?? {});
      setRolePermissions(data.permissions ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await authRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authRequest("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    setUser(null);
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
