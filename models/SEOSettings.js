const mongoose = require("mongoose");

const seoSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "DealBeez" },
    siteUrl: { type: String, default: "https://coupondealz.com" },
    defaultTitle: { type: String, default: "" },
    defaultDescription: { type: String, default: "" },
    twitterHandle: { type: String, default: "@dealbeez" },
    robotsTxt: {
      allowAll: { type: Boolean, default: true },
      disallowPaths: {
        type: [String],
        default: [
          "/api/",
          "/admin/",
          "/search",
          "/signin",
          "/register",
          "/dashboard",
          "/submit-deal",
        ],
      },
      crawlDelay: { type: Number, default: null },
    },
    sitemap: {
      enabled: { type: Boolean, default: true },
      includeStores: { type: Boolean, default: true },
      includeCoupons: { type: Boolean, default: true },
      includeCategories: { type: Boolean, default: true },
      includeBlogs: { type: Boolean, default: true },
    },
    indexNow: {
      enabled: { type: Boolean, default: true },
      apiKey: { type: String, default: "" },
    },
    googleSiteVerification: { type: String, default: "" },
    bingSiteVerification: { type: String, default: "" },
    searchConsole: {
      autoSubmitSitemap: { type: Boolean, default: false },
      lastSitemapPingAt: { type: Date },
    },
  },
  { timestamps: true }
);

seoSettingsSchema.statics.getSettings = async function getSettings() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("SEOSettings", seoSettingsSchema);
