import { usePermissions } from "../hooks/usePermissions";

const Can = ({ module, action, children, fallback = null }) => {
  const { can } = usePermissions();

  if (!can(module, action)) {
    return fallback;
  }

  return children;
};

export default Can;
