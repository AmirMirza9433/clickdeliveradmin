import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  hasAction as checkAction,
  hasModuleAccess as checkModuleAccess,
  isMainAdmin as checkMainAdmin,
} from "../constants/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  return useMemo(
    () => ({
      user,
      isMainAdmin: checkMainAdmin(user),
      canAccess: (module) => checkModuleAccess(user, module),
      can: (module, action) => checkAction(user, module, action),
    }),
    [user],
  );
};
