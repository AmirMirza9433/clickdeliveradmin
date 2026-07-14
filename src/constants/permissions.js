export const PERMISSION_MODULES = [
  { id: "overview", label: "Overview (Dashboard)", actions: ["yes"] },
  { id: "notifications", label: "Notifications", actions: ["yes"] },
  {
    id: "chats",
    label: "Chats",
    actions: ["read_user_chat", "continue_chat"],
  },
  { id: "cities", label: "Cities", actions: ["view", "create", "edit", "delete"] },
  { id: "orders", label: "Orders", actions: ["view", "edit"] },
  { id: "customOrders", label: "Custom Orders", actions: ["view", "edit"] },
  { id: "rides", label: "Rides & Parcels", actions: ["view", "edit"] },
  {
    id: "products",
    label: "Products",
    actions: ["view", "create", "edit", "delete", "manage_stock"],
  },
  { id: "customers", label: "Customers", actions: ["view", "delete"] },
  {
    id: "shops",
    label: "Shops",
    actions: ["view", "delete", "verify", "manage_percentage_charge"],
  },
  { id: "riders", label: "Riders", actions: ["view", "delete", "verify"] },
  {
    id: "banners",
    label: "Banners",
    actions: [
      "view",
      "create",
      "edit",
      "delete",
      "request_approve",
      "request_reject",
      "expire",
    ],
  },
  {
    id: "paymentMethods",
    label: "Payment Methods",
    actions: ["view", "create", "edit", "delete"],
  },
  { id: "walletDeposits", label: "Wallet Deposits & Withdraws", actions: ["approve", "reject"] },
  { id: "settings", label: "Settings", actions: ["view", "update"] },
];

export const MODULE_ACTION_MAP = PERMISSION_MODULES.reduce((acc, module) => {
  acc[module.id] = new Set(module.actions);
  return acc;
}, {});

const ACTION_LABELS = {
  yes: "Yes",
  read_user_chat: "Read User Chat",
  continue_chat: "Continue Chat",
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage_stock: "Manage Stock",
  verify: "Verify",
  manage_percentage_charge: "Manage Percentage Charge",
  request_approve: "Approve Requests",
  request_reject: "Reject Requests",
  expire: "Expire",
  approve: "Approve",
  reject: "Reject",
  update: "Update",
};

export const isMainAdmin = (user) => user?.role === "admin";

export const getModulePermission = (user, module) =>
  user?.permissions?.find((permission) => permission.module === module);

export const hasModuleAccess = (user, module) => {
  if (isMainAdmin(user)) {
    return true;
  }

  if (user?.role !== "sub-admin") {
    return false;
  }

  const modulePermission = getModulePermission(user, module);
  return Boolean(modulePermission?.actions?.length);
};

export const hasAction = (user, module, action) => {
  if (isMainAdmin(user)) {
    return true;
  }

  if (user?.role !== "sub-admin") {
    return false;
  }

  const modulePermission = getModulePermission(user, module);
  return Boolean(modulePermission?.actions?.includes(action));
};

export const getActionLabel = (action) => ACTION_LABELS[action] || action;
