const express = require("express");
const blogController = require("../controllers/blogController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/adminMiddleware");
const { PERMISSIONS } = require("../constants/adminPermissions");

const router = express.Router();

router.get("/all", blogController.listPublished);
router.get("/slug/:slug", blogController.getBySlug);

router.post(
  "/",
  optionalAuth,
  requirePermission(PERMISSIONS.BLOG_MANAGE),
  blogController.create
);
router.put(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.BLOG_MANAGE),
  blogController.updateBySlug
);
router.delete(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.BLOG_MANAGE),
  blogController.destroyBySlug
);

module.exports = router;
