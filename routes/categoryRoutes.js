const express = require("express");
const categoryController = require("../controllers/categoryController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/adminMiddleware");
const { PERMISSIONS } = require("../constants/adminPermissions");

const router = express.Router();

router.get("/all", categoryController.listAll);

router.post(
  "/",
  optionalAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  categoryController.create
);
router.put(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  categoryController.updateBySlug
);
router.delete(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  categoryController.destroyBySlug
);

router.get("/slug/:slug", categoryController.getBySlug);

module.exports = router;
