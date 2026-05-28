const mongoose = require("mongoose");

const localeBlockSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    slug: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    focusKeyword: { type: String, default: "" },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    featuredImage: { type: String, default: "" },
    readMins: { type: Number, default: 5, min: 1 },
    authorName: { type: String, default: "CouponDealz", trim: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
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
    i18n: {
      type: Map,
      of: localeBlockSchema,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model("BlogPost", blogPostSchema);
