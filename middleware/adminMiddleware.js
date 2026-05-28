const {
  isStaff,
  isAdmin,
  hasAnyPermission,
} = require("../constants/adminPermissions");

function apiKeyAdmin(req) {
  const key = req.headers["x-admin-api-key"];
  return !!(process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY);
}

/** Any staff role (not public `user`). */
function requireStaff(req, res, next) {
  if (apiKeyAdmin(req)) {
    req.adminAuth = "api-key";
    return next();
  }
  if (req.user && isStaff(req.user)) {
    req.adminAuth = "jwt";
    return next();
  }
  return res.status(403).json({
    error: true,
    code: "FORBIDDEN",
    message: "Staff access required",
  });
}

/** Full administrator only (user management, etc.). */
function requireAdmin(req, res, next) {
  if (apiKeyAdmin(req)) {
    req.adminAuth = "api-key";
    return next();
  }
  if (req.user && isAdmin(req.user)) {
    req.adminAuth = "jwt";
    return next();
  }
  return res.status(403).json({
    error: true,
    code: "FORBIDDEN",
    message: "Administrator access required",
  });
}

/** Legacy alias: staff with any permission (same as requireStaff for router mount). */
function requireAdminLegacy(req, res, next) {
  return requireStaff(req, res, next);
}

function requirePermission(...permissions) {
  return (req, res, next) => {
    if (apiKeyAdmin(req)) {
      req.adminAuth = "api-key";
      return next();
    }
    if (!req.user || !isStaff(req.user)) {
      return res.status(403).json({
        error: true,
        code: "FORBIDDEN",
        message: "Staff access required",
      });
    }
    if (permissions.length === 0 || hasAnyPermission(req.user, permissions)) {
      return next();
    }
    return res.status(403).json({
      error: true,
      code: "FORBIDDEN",
      message: "You do not have permission for this action",
    });
  };
}

module.exports = {
  requireStaff,
  requireAdmin,
  requireAdminLegacy,
  requirePermission,
};
