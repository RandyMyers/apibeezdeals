const express = require("express");
const adminController = require("../controllers/adminController");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");
const seoSettingsController = require("../controllers/seoSettingsController");
const mediaController = require("../controllers/mediaController");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  requireStaff,
  requireAdmin,
  requirePermission,
} = require("../middleware/adminMiddleware");
const { PERMISSIONS } = require("../constants/adminPermissions");

const router = express.Router();

router.use(requireAuth, requireStaff);

router.get(
  "/upload/status",
  requirePermission(PERMISSIONS.MEDIA_UPLOAD),
  mediaController.getUploadStatus
);
router.post(
  "/upload",
  requirePermission(PERMISSIONS.MEDIA_UPLOAD),
  mediaController.uploadImage
);

router.get(
  "/seo-settings",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  seoSettingsController.getSettings
);
router.patch(
  "/seo-settings",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  seoSettingsController.patchSettings
);

router.get(
  "/stats",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminController.stats
);
router.get(
  "/analytics/overview",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminAnalyticsController.overview
);
router.get(
  "/analytics/top-pages",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminAnalyticsController.topPages
);
router.get(
  "/analytics/countries",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminAnalyticsController.countries
);
router.get(
  "/visitors",
  requirePermission(PERMISSIONS.VISITORS_VIEW),
  adminAnalyticsController.listVisitors
);
router.get(
  "/analytics/live",
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminAnalyticsController.live
);

router.get(
  "/categories",
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.listCatalogCategories
);
router.get(
  "/blog-posts",
  requirePermission(PERMISSIONS.BLOG_MANAGE),
  adminController.listCatalogBlogPosts
);
router.get(
  "/legal-pages",
  requirePermission(PERMISSIONS.LEGAL_MANAGE),
  adminController.listLegalPages
);
router.patch(
  "/legal-pages/:slug",
  requirePermission(PERMISSIONS.LEGAL_MANAGE),
  adminController.patchLegalPage
);
router.get(
  "/stores",
  requirePermission(PERMISSIONS.STORES_MANAGE),
  adminController.listCatalogStores
);
router.get(
  "/stores/:slug/stats",
  requirePermission(PERMISSIONS.STORES_MANAGE),
  adminController.getStoreStats
);
router.get(
  "/coupons",
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  adminController.listCatalogCoupons
);
router.get(
  "/coupons/:publicId/stats",
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  adminController.getCouponStats
);
router.get(
  "/coupons/:publicId",
  requirePermission(PERMISSIONS.COUPONS_MANAGE),
  adminController.getCatalogCoupon
);

router.get("/users", requireAdmin, adminController.listUsers);
router.post("/users", requireAdmin, adminController.createUser);
router.patch("/users/:publicId", requireAdmin, adminController.patchUser);

router.get(
  "/comments",
  requirePermission(PERMISSIONS.COMMENTS_MANAGE),
  adminController.listModerationComments
);
router.get(
  "/contact-messages",
  requirePermission(PERMISSIONS.MESSAGES_MANAGE),
  adminController.listContactMessages
);
router.patch(
  "/contact-messages/:publicId",
  requirePermission(PERMISSIONS.MESSAGES_MANAGE),
  adminController.patchContactMessage
);
router.get(
  "/activity",
  requirePermission(PERMISSIONS.ACTIVITY_VIEW),
  adminController.listActivity
);
router.get(
  "/coupon-submissions",
  requirePermission(PERMISSIONS.SUBMISSIONS_MANAGE),
  adminController.listSubmissions
);
router.patch(
  "/coupon-submissions/:publicId",
  requirePermission(PERMISSIONS.SUBMISSIONS_MANAGE),
  adminController.patchSubmission
);

router.get(
  "/affiliates",
  requirePermission(PERMISSIONS.AFFILIATES_MANAGE),
  adminController.listAffiliates
);
router.post(
  "/affiliates",
  requirePermission(PERMISSIONS.AFFILIATES_MANAGE),
  adminController.createAffiliate
);
router.patch(
  "/affiliates/:publicId",
  requirePermission(PERMISSIONS.AFFILIATES_MANAGE),
  adminController.patchAffiliate
);
router.delete(
  "/affiliates/:publicId",
  requirePermission(PERMISSIONS.AFFILIATES_MANAGE),
  adminController.deleteAffiliate
);

module.exports = router;
