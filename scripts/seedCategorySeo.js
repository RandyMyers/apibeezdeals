/**
 * Backfill category SEO fields + FAQs for all active categories.
 * Usage: node scripts/seedCategorySeo.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const { categorySeoBlock } = require("../data/categorySeoTemplates");

async function run() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required");
  await mongoose.connect(process.env.MONGO_URL);

  const categories = await Category.find({}).lean();
  let updated = 0;

  for (const cat of categories) {
    const block = categorySeoBlock(cat.name);
    await Category.updateOne(
      { slug: cat.slug },
      {
        $set: {
          metaTitle: cat.metaTitle || block.metaTitle,
          metaDescription: cat.metaDescription || block.metaDescription,
          seoIntro: cat.seoIntro || block.seoIntro,
          faqs: cat.faqs?.length >= 3 ? cat.faqs : block.faqs,
        },
      }
    );
    updated += 1;
    console.log(`Category SEO: ${cat.slug}`);
  }

  console.log(`Updated ${updated} categories.`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
