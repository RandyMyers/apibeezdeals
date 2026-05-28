const mongoose = require("mongoose");

/**
 * Published coupon catalog fields only.
 * `views`, `upvotes`, `downvotes`, `comments` are denormalised counters maintained from
 * CouponView, CouponVote (+1/-1 buckets), and CouponComment — not authored directly on create.
 */
const couponSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    storePublicId: { type: String, required: true, index: true },
    storeSlug: { type: String, required: true, index: true },
    storeName: { type: String, required: true },
    storeLogo: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    discountValue: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "freeShipping", "bogo"],
      default: "percentage",
    },
    code: { type: String, default: "" },
    type: { type: String, enum: ["code", "deal", "sale"], default: "code" },
    verified: { type: Boolean, default: false },
    exclusive: { type: Boolean, default: false },
    expiresAt: { type: String, default: "" },
    usedCount: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    postedBy: { type: String, default: "" },
    postedAt: { type: String, default: "" },
    views: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    details: { type: String, default: "" },
    productImage: { type: String, default: "" },
    originalPrice: { type: String, default: "" },
    salePrice: { type: String, default: "" },
    freeShipping: { type: Boolean, default: false },
    features: [{ type: String }],
    categorySlug: { type: String, default: "", index: true },
    isPublished: { type: Boolean, default: true },
    /** Empty or omitted = available in all countries; otherwise ISO 3166-1 alpha-2 codes (e.g. IE, GB). */
    countries: { type: [String], default: [] },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    focusKeyword: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    robots: { type: String, default: "index,follow" },
    sitemapInclude: { type: Boolean, default: true },
    sitemapPriority: { type: Number, default: 0.6, min: 0, max: 1 },
    sitemapChangefreq: {
      type: String,
      default: "weekly",
      enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
    },
    languageTranslations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

couponSchema.index({ storeSlug: 1, isPublished: 1 });
couponSchema.index({ isPublished: 1, upvotes: -1 });

module.exports = mongoose.model("Coupon", couponSchema);
