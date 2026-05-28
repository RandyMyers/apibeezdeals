/**
 * Seed / update Trip.com store with SEO content and FAQs from trip.txt.
 *
 * Usage:
 *   node scripts/seedTripComStore.js
 *
 * Env:
 *   MONGO_URL
 *   LOGO_DEV_TOKEN (optional — logo URL from img.logo.dev, same as seedPopularStores.js)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Category = require("../models/Category");
const tripData = require("../data/seedTripComStore");
const { toSlug, storeFieldsFromCategory } = require("../utils/categoryLink");
const { pickFaqs } = require("../utils/storePayload");

const LOGO_DEV_TOKEN = process.env.LOGO_DEV_TOKEN || "";

function logoUrl(storeUrl, size = 200) {
  if (!LOGO_DEV_TOKEN) return "";
  try {
    const domain = new URL(storeUrl).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${size}&format=png`;
  } catch {
    return "";
  }
}

async function ensureCategory(categoryName) {
  const slug = toSlug(categoryName);
  let cat = await Category.findOne({ slug }).lean();
  if (!cat) {
    cat = (
      await Category.create({
        slug,
        name: categoryName,
        description: "",
        isActive: true,
      })
    ).toObject();
    console.log(`Created category: ${categoryName}`);
  }
  return cat;
}

async function getNextPublicId() {
  const rows = await Store.find({ publicId: { $regex: "^\\d+$" } })
    .select("publicId")
    .lean();
  let max = 0;
  for (const row of rows) {
    const n = Number(row.publicId);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

function buildStorePayload(categoryFields, logo, ogImage) {
  const faqs = pickFaqs(tripData.faqs) || [];
  return {
    name: tripData.name,
    slug: tripData.slug,
    logo,
    logoAlt: tripData.logoAlt,
    description: tripData.description,
    websiteUrl: tripData.websiteUrl,
    linkRelType: "noreferrer",
    isPublished: true,
    ...categoryFields,
    faqs,
    seoH1: tripData.seoH1,
    seoIntro: tripData.seoIntro,
    seoPrimaryKeyword: tripData.seoPrimaryKeyword,
    metaTitle: tripData.metaTitle,
    metaDescription: tripData.metaDescription,
    keywords: tripData.keywords,
    focusKeyword: tripData.focusKeyword,
    canonicalUrl: tripData.canonicalUrl,
    ogImage,
    robots: tripData.robots,
    contentUpdatedAt: new Date(tripData.contentUpdatedAt),
    lastVerifiedAt: new Date(tripData.lastVerifiedAt),
  };
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("Set MONGO_URL in server/.env");
    process.exit(1);
  }

  if (!LOGO_DEV_TOKEN) {
    console.warn("LOGO_DEV_TOKEN is not set. Store will be seeded without logo URLs.");
  }

  await mongoose.connect(process.env.MONGO_URL);

  try {
    const cat = await ensureCategory(tripData.categoryName);
    const categoryFields = storeFieldsFromCategory(cat);
    const logo = logoUrl(tripData.websiteUrl, 200);
    const ogImage = logoUrl(tripData.websiteUrl, 512) || logo;

    const payload = buildStorePayload(categoryFields, logo, ogImage);

    const existing = await Store.findOne({
      $or: [
        { slug: tripData.slug },
        { name: /^trip\.com$/i },
        { slug: "trip-com" },
        { websiteUrl: /trip\.com/i },
      ],
    }).select("_id publicId slug logo websiteUrl");

    if (existing) {
      const update = { ...payload };
      if (!logo && existing.logo) {
        update.logo = existing.logo;
        update.ogImage = existing.logo;
      }
      await Store.updateOne({ _id: existing._id }, { $set: update });
      console.log(
        `Updated Trip.com store (slug: ${existing.slug} → ${tripData.slug}, ${payload.faqs.length} FAQs, logo: ${update.logo ? "yes" : "no"})`
      );
    } else {
      const publicId = String(await getNextPublicId());
      await Store.create({ publicId, ...payload });
      console.log(
        `Created Trip.com store (publicId: ${publicId}, ${payload.faqs.length} FAQs, logo: ${logo ? "yes" : "no"})`
      );
    }

    const saved = await Store.findOne({ slug: tripData.slug })
      .select("name slug logo websiteUrl faqs seoH1 metaTitle")
      .lean();
    console.log("\nSaved store summary:");
    console.log({
      name: saved.name,
      slug: saved.slug,
      websiteUrl: saved.websiteUrl,
      logo: saved.logo ? `${saved.logo.slice(0, 60)}…` : "(empty)",
      faqCount: saved.faqs?.length || 0,
      seoH1: saved.seoH1,
      metaTitle: saved.metaTitle,
    });
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
