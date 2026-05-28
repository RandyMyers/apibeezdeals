const express = require("express");
const storeController = require("../controllers/storeController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/adminMiddleware");
const { PERMISSIONS } = require("../constants/adminPermissions");

const router = express.Router();

router.get("/all", storeController.listAll);

router.post(
  "/",
  optionalAuth,
  requirePermission(PERMISSIONS.STORES_MANAGE),
  storeController.create
);
router.put(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.STORES_MANAGE),
  storeController.updateBySlug
);
router.delete(
  "/slug/:slug",
  optionalAuth,
  requirePermission(PERMISSIONS.STORES_MANAGE),
  storeController.destroyBySlug
);

router.get(
  "/slug/:slug/coupons",
  optionalAuth,
  storeController.listCouponsForStore
);
router.get("/slug/:slug", storeController.getBySlug);

module.exports = router;
