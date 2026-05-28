/**
 * Initialize SEO settings document with production defaults.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const SEOSettings = require("../models/SEOSettings");

async function run() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required");
  await mongoose.connect(process.env.MONGO_URL);

  const siteUrl =
    process.env.CLIENT_PUBLIC_URL ||
    process.env.REACT_APP_SITE_URL ||
    "https://coupondealz.com";

  await SEOSettings.findOneAndUpdate(
    {},
    {
      $set: {
        siteName: "DealBeez",
        siteUrl: siteUrl.replace(/\/$/, ""),
        twitterHandle: "@dealbeez",
        sitemap: {
          enabled: true,
          includeStores: true,
          includeCoupons: true,
          includeCategories: true,
          includeBlogs: true,
        },
        indexNow: {
          enabled: true,
          apiKey: process.env.INDEXNOW_API_KEY || "",
        },
        searchConsole: {
          autoSubmitSitemap: true,
        },
        robotsTxt: {
          allowAll: true,
          disallowPaths: [
            "/api/",
            "/admin/",
            "/search",
            "/signin",
            "/register",
            "/dashboard",
            "/submit-deal",
            "/forgot-password",
            "/reset-password",
          ],
        },
      },
    },
    { upsert: true, new: true }
  );

  console.log(`SEO settings saved (siteUrl=${siteUrl})`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
