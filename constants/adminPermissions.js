/**
 * Admin panel roles and permissions.
 * Public site members use role `user` (no admin access).
 */

const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  CATEGORIES_MANAGE: "categories.manage",
  STORES_MANAGE: "stores.manage",
  COUPONS_MANAGE: "coupons.manage",
  BLOG_MANAGE: "blog.manage",
  LEGAL_MANAGE: "legal.manage",
  SUBMISSIONS_MANAGE: "submissions.manage",
  COMMENTS_MANAGE: "comments.manage",
  MESSAGES_MANAGE: "messages.manage",
  AFFILIATES_MANAGE: "affiliates.manage",
  USERS_MANAGE: "users.manage",
  VISITORS_VIEW: "visitors.view",
  ACTIVITY_VIEW: "activity.view",
  MEDIA_UPLOAD: "media.upload",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** Roles that may sign in to the admin panel */
const STAFF_ROLES = [
  "admin",
  "blog_editor",
  "seo_editor",
  "content_editor",
  "moderator",
];

const ROLE_LABELS = {
  user: "Site member",
  admin: "Administrator",
  blog_editor: "Blog editor",
  seo_editor: "SEO & catalog",
  content_editor: "Content manager",
  moderator: "Moderator",
};

const ROLE_DESCRIPTIONS = {
  admin: "Full access to the admin panel, including user management.",
  blog_editor: "Create and edit blog posts and upload media.",
  seo_editor: "Manage categories, stores, and coupons (content & SEO).",
  content_editor: "Blog posts plus catalog content (stores, coupons, categories).",
  moderator: "Review submissions, comments, and contact messages.",
  user: "Public site account only — cannot access admin.",
};

const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  blog_editor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BLOG_MANAGE,
    PERMISSIONS.LEGAL_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
  ],
  seo_editor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.STORES_MANAGE,
    PERMISSIONS.COUPONS_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
  ],
  content_editor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.STORES_MANAGE,
    PERMISSIONS.COUPONS_MANAGE,
    PERMISSIONS.BLOG_MANAGE,
    PERMISSIONS.LEGAL_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
  ],
  moderator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SUBMISSIONS_MANAGE,
    PERMISSIONS.COMMENTS_MANAGE,
    PERMISSIONS.MESSAGES_MANAGE,
    PERMISSIONS.ACTIVITY_VIEW,
  ],
  user: [],
};

const ASSIGNABLE_STAFF_ROLES = STAFF_ROLES.filter((r) => r !== "admin").concat([
  "admin",
]);

function getPermissionsForUser(user) {
  if (!user) return [];
  if (user.role === "admin") return ALL_PERMISSIONS;
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  }
  return ROLE_PERMISSIONS[user.role] || [];
}

function hasPermission(user, permission) {
  if (!user || user.isActive === false) return false;
  return getPermissionsForUser(user).includes(permission);
}

function hasAnyPermission(user, permissions) {
  return permissions.some((p) => hasPermission(user, p));
}

function isStaff(user) {
  if (!user || user.isActive === false) return false;
  return STAFF_ROLES.includes(user.role);
}

function isAdmin(user) {
  return user && user.role === "admin" && user.isActive !== false;
}

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  STAFF_ROLES,
  ASSIGNABLE_STAFF_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  getPermissionsForUser,
  hasPermission,
  hasAnyPermission,
  isStaff,
  isAdmin,
};
