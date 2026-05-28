const express = require("express");
const couponController = require("../controllers/couponController");
const couponViewController = require("../controllers/couponViewController");
const couponVoteController = require("../controllers/couponVoteController");
const couponCommentController = require("../controllers/couponCommentController");
const { optionalAuth, requireAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/adminMiddleware");
const { PERMISSIONS } = require("../constants/adminPermissions");

const router = express.Router();

router.get("/all", optionalAuth, couponController.listAll);
router.get("/trending", optionalAuth, couponController.listTrending);
router.get("/category/:slug", optionalAuth, couponController.listByCategorySlug);

router.post(
  "/",
  optionalAuth,
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  couponController.create
);

router.put(
  "/:id/comments/:commentId",
  requireAuth,
  couponCommentController.update
);
router.delete(
  "/:id/comments/:commentId",
  requireAuth,
  couponCommentController.remove
);
router.post("/:id/comments", requireAuth, couponCommentController.create);
router.get("/:id/comments", couponCommentController.listForCoupon);

router.post("/:id/views", optionalAuth, couponViewController.record);
router.post("/:id/votes", requireAuth, couponVoteController.upsert);
router.delete("/:id/votes/me", requireAuth, couponVoteController.removeMine);

router.put(
  "/:id",
  optionalAuth,
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  couponController.update
);
router.delete(
  "/:id",
  optionalAuth,
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  couponController.destroy
);

router.get("/:id", optionalAuth, couponController.getByPublicId);

module.exports = router;
