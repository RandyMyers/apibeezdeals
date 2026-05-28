/**
 * Backfill store SEO (meta, intro, 3+ FAQs) for published stores missing content.
 * Usage: node scripts/seedStoresSeoBackfill.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const { storeSeoDefaults } = require("../data/storeSeoTemplates");
const { activeFaqs } = require("../utils/storePublishValidation");

async function run() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required");
  await mongoose.connect(process.env.MONGO_URL);

  const stores = await Store.find({ isPublished: { $ne: false } }).lean();
  let updated = 0;

  for (const store of stores) {
    const needsFaqs = activeFaqs(store).length < 3;
    const needsMeta = !store.metaTitle && !store.seoH1;
    const needsIntro = !store.seoIntro && !store.metaDescription;

    if (!needsFaqs && !needsMeta && !needsIntro && store.logoAlt) continue;

    const defaults = storeSeoDefaults(store);
    const $set = {};

    if (needsMeta) {
      $set.metaTitle = defaults.metaTitle;
      $set.seoH1 = defaults.seoH1;
      $set.metaDescription = defaults.metaDescription;
    }
    if (needsIntro) $set.seoIntro = defaults.seoIntro;
    if (!store.logoAlt) $set.logoAlt = defaults.logoAlt;
    if (needsFaqs) $set.faqs = defaults.faqs;
    if (!store.contentUpdatedAt) $set.contentUpdatedAt = defaults.contentUpdatedAt;
    if (!store.lastVerifiedAt) $set.lastVerifiedAt = defaults.lastVerifiedAt;

    await Store.updateOne({ slug: store.slug }, { $set });
    updated += 1;
    console.log(`Store SEO backfill: ${store.slug}`);
  }

  console.log(`Backfilled ${updated} of ${stores.length} published stores.`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
