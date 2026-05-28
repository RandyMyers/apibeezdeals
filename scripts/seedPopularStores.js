require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Category = require("../models/Category");
const { toSlug, storeFieldsFromCategory } = require("../utils/categoryLink");

const LOGO_DEV_TOKEN = process.env.LOGO_DEV_TOKEN || "";

function logoUrl(storeUrl) {
  if (!LOGO_DEV_TOKEN) return "";
  try {
    const domain = new URL(storeUrl).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=200&format=png`;
  } catch {
    return "";
  }
}

const STORES = [
  { name: "Uber", category: "Travel", url: "https://www.uber.com" },
  { name: "Uber Eats", category: "Restaurants & Dining", url: "https://www.ubereats.com" },
  { name: "Glovo", category: "Restaurants & Dining", url: "https://glovoapp.com" },
  { name: "Domino's Pizza", category: "Restaurants & Dining", url: "https://www.dominos.com" },
  { name: "DoorDash", category: "Restaurants & Dining", url: "https://www.doordash.com" },
  { name: "Grubhub", category: "Restaurants & Dining", url: "https://www.grubhub.com" },
  { name: "Nike", category: "Sports Apparel", url: "https://www.nike.com" },
  { name: "Adidas", category: "Sports Apparel", url: "https://www.adidas.com" },
  { name: "Edikted", category: "Fashion", url: "https://edikted.com" },
  { name: "Wear Felicity", category: "Fashion", url: "https://wearfelicity.com" },
  { name: "Everlane", category: "Fashion", url: "https://www.everlane.com" },
  { name: "HALARA", category: "Sports Apparel", url: "https://www.halara.com" },
  { name: "FIGS", category: "Fashion", url: "https://www.wearfigs.com" },
  { name: "JCPenney", category: "Women's Fashion", url: "https://www.jcpenney.com" },
  { name: "Kohl's", category: "Women's Fashion", url: "https://www.kohls.com" },
  { name: "Macy's", category: "Women's Fashion", url: "https://www.macys.com" },
  { name: "H&M", category: "Fashion", url: "https://www.hm.com" },
  { name: "Zara", category: "Fashion", url: "https://www.zara.com" },
  { name: "ASOS", category: "Fashion", url: "https://www.asos.com" },
  { name: "Shein", category: "Fashion", url: "https://www.shein.com" },
  { name: "DRMTLGY", category: "Skincare", url: "https://drmtlgy.com" },
  { name: "Happy Mammoth", category: "Health & Beauty", url: "https://happymammoth.com" },
  { name: "Boxbollen", category: "Fitness & Wellness", url: "https://boxbollen.com" },
  { name: "GNC", category: "Health & Beauty", url: "https://www.gnc.com" },
  { name: "Peloton", category: "Fitness Equipment", url: "https://www.onepeloton.com" },
  { name: "ClassPass", category: "Fitness & Wellness", url: "https://classpass.com" },
  { name: "iHerb", category: "Health & Beauty", url: "https://www.iherb.com" },
  { name: "Calm", category: "Health & Beauty", url: "https://www.calm.com" },
  { name: "Best Buy", category: "Electronics", url: "https://www.bestbuy.com" },
  { name: "Zenni Optical", category: "Health & Beauty", url: "https://www.zennioptical.com" },
  { name: "Newegg", category: "Electronics", url: "https://www.newegg.com" },
  { name: "Apple", category: "Electronics", url: "https://www.apple.com" },
  { name: "Chewy", category: "Pet Supplies", url: "https://www.chewy.com" },
  { name: "Petco", category: "Pet Supplies", url: "https://www.petco.com" },
  { name: "Target", category: "Home & Garden", url: "https://www.target.com" },
  { name: "The Container Store", category: "Home & Garden", url: "https://www.containerstore.com" },
  { name: "Bed Bath & Beyond", category: "Bedding & Bath", url: "https://www.bedbathandbeyond.com" },
  { name: "Bath & Body Works", category: "Personal Care", url: "https://www.bathandbodyworks.com" },
  { name: "Dick's Sporting Goods", category: "Sports & Outdoors", url: "https://www.dickssportinggoods.com" },
  { name: "Home Depot", category: "Tools & Hardware", url: "https://www.homedepot.com" },
  { name: "IKEA", category: "Furniture", url: "https://www.ikea.com" },
  { name: "Wayfair", category: "Furniture", url: "https://www.wayfair.com" },
  { name: "HelloFresh", category: "Food & Beverages", url: "https://www.hellofresh.com" },
  { name: "Factor", category: "Food & Beverages", url: "https://www.factormeals.com" },
  { name: "TurboTax", category: "Software & Apps", url: "https://turbotax.intuit.com" },
  { name: "Hostinger", category: "Software & Apps", url: "https://www.hostinger.com?REFERRALCODE=1GAEL52" },
  { name: "H&R Block", category: "Software & Apps", url: "https://www.hrblock.com" },
  { name: "Rakuten", category: "Financial Services", url: "https://www.rakuten.com" },
  { name: "JomaShop", category: "Jewelry & Watches", url: "https://www.jomashop.com" },
  { name: "4imprint", category: "Office Supplies", url: "https://www.4imprint.com" },
  { name: "Walmart", category: "Grocery", url: "https://www.walmart.com" },
  { name: "Amazon", category: "Electronics", url: "https://www.amazon.com" },
  { name: "eBay", category: "Electronics", url: "https://www.ebay.com" },
  { name: "Etsy", category: "Home Decor", url: "https://www.etsy.com" },
  { name: "Costco", category: "Grocery", url: "https://www.costco.com" },
  { name: "Sephora", category: "Makeup & Cosmetics", url: "https://www.sephora.com" },
  { name: "Ulta Beauty", category: "Makeup & Cosmetics", url: "https://www.ulta.com" },
  { name: "Booking.com", category: "Hotels & Accommodation", url: "https://www.booking.com" },
  { name: "Airbnb", category: "Hotels & Accommodation", url: "https://www.airbnb.com" },
];

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
  }
  return cat;
}

async function getNextPublicId() {
  const latest = await Store.findOne({ publicId: { $regex: "^\\d+$" } })
    .sort({ publicId: -1 })
    .select("publicId")
    .lean();
  return latest ? Number(latest.publicId) + 1 : 1;
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("Set MONGO_URL in server/.env");
    process.exit(1);
  }

  if (!LOGO_DEV_TOKEN) {
    console.warn("LOGO_DEV_TOKEN is not set. Stores will be seeded without logos.");
  }

  await mongoose.connect(process.env.MONGO_URL);

  try {
    let nextPublicId = await getNextPublicId();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of STORES) {
      const slug = toSlug(item.name);
      const logo = logoUrl(item.url);
      const cat = await ensureCategory(item.category);
      const categoryFields = storeFieldsFromCategory(cat);

      const existing = await Store.findOne({ slug }).select("_id logo websiteUrl");
      if (!existing) {
        await Store.create({
          publicId: String(nextPublicId++),
          name: item.name,
          slug,
          logo,
          couponCount: 0,
          bestDiscount: "",
          ...categoryFields,
          isPublished: true,
          websiteUrl: item.url,
          linkRelType: "noreferrer",
        });
        inserted++;
        continue;
      }

      const updatePayload = {
        ...categoryFields,
      };

      if (!existing.logo && logo) updatePayload.logo = logo;
      if (!existing.websiteUrl) updatePayload.websiteUrl = item.url;

      const result = await Store.updateOne({ _id: existing._id }, { $set: updatePayload });
      if (result.modifiedCount > 0) updated++;
      else skipped++;
    }

    console.log(
      `Popular stores seed complete: ${inserted} inserted, ${updated} updated, ${skipped} unchanged.`
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
