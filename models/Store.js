const mongoose = require("mongoose");

const storeFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    group: {
      type: String,
      enum: ["faq", "paa", "troubleshooting"],
      default: "faq",
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const storeLocaleBlockSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    logoAlt: { type: String, default: "" },
    seoH1: { type: String, default: "" },
    seoIntro: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    focusKeyword: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    robots: { type: String, default: "" },
    faqs: { type: [storeFaqSchema], default: [] },
  },
  { _id: false }
);

/** `publicId` mirrors the template client string id (e.g. "1") for stable keys. */
const storeSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, default: "" },
    logoAlt: { type: String, default: "" },
    description: { type: String, default: "" },
    couponCount: { type: Number, default: 0 },
    bestDiscount: { type: String, default: "" },
    /** Display label (denormalized from Category.name). */
    category: { type: String, default: "" },
    /** URL slug (denormalized from Category.slug). */
    categorySlug: { type: String, default: "", index: true },
    /** Reference to Category — source of truth for store ↔ category link. */
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    isPublished: { type: Boolean, default: true },
    /** Merchant site URL for “Visit store” on the public client. */
    websiteUrl: { type: String, default: "", trim: true },
    linkRelType: {
      type: String,
      enum: ["follow", "nofollow", "sponsored", "noreferrer"],
      default: "noreferrer",
    },
    countries: { type: [String], default: [] },
    faqs: { type: [storeFaqSchema], default: [] },
    seoPrimaryKeyword: { type: String, default: "" },
    seoH1: { type: String, default: "" },
    seoIntro: { type: String, default: "" },
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
    contentUpdatedAt: { type: Date },
    lastVerifiedAt: { type: Date },
    languageTranslations: {
      type: Map,
      of: storeLocaleBlockSchema,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

storeSchema.index({ categorySlug: 1, name: 1 });

module.exports = mongoose.model("Store", storeSchema);
