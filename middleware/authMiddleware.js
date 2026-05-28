const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

function parseBearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/** Attach `req.user` when a valid Bearer token is present. */
async function optionalAuth(req, res, next) {
  req.user = null;
  const token = parseBearer(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (user) req.user = user;
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}

/** Require `req.user` (401 if missing or invalid). */
async function requireAuth(req, res, next) {
  const token = parseBearer(req);
  if (!token) {
    return res.status(401).json({
      error: true,
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({
        error: true,
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: true,
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

module.exports = { optionalAuth, requireAuth };
