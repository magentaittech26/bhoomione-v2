import { useState, useEffect } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";

export function usePermissions(userProp?: UserProfile | null) {
  const [user, setUser] = useState<UserProfile | null>(userProp || api.getCurrentUser());

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
    } else {
      setUser(api.getCurrentUser());
    }
  }, [userProp]);

  const permissions: string[] = user?.permissions || [];

  const roleUpper = user?.role ? user.role.toUpperCase() : "";
  const isPlatformAdmin = roleUpper === "PLATFORM_ADMIN";

  const hasPermission = (permissionCode: string): boolean => {
    if (isPlatformAdmin) return true;
    if (!permissions || permissions.length === 0) return false;
    return permissions.includes(permissionCode);
  };

  return {
    permissions,
    hasPermission,
    can: hasPermission,
    user,
  };
}

export function usePermission(permissionCode: string, userProp?: UserProfile | null): boolean {
  const { hasPermission } = usePermissions(userProp);
  return hasPermission(permissionCode);
}
