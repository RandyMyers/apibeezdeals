/**
 * Create one verified coupon per published store (idempotent by publicId pattern).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Coupon = require("../models/Coupon");
const { createPublicId } = require("../utils/publicId");

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const stores = await Store.find({ isPublished: { $ne: false } }).lean();
  let created = 0;
  let skipped = 0;

  for (const store of stores) {
    const pid = `auto-${store.slug}`.slice(0, 32);
    const exists = await Coupon.findOne({ publicId: pid });
    if (exists) {
      skipped += 1;
      continue;
    }
    await Coupon.create({
      publicId: pid,
      storePublicId: store.publicId,
      storeSlug: store.slug,
      storeName: store.name,
      storeLogo: store.logo,
      title: `${store.bestDiscount || "10% Off"} at ${store.name}`,
      description: `<p>Save at <strong>${store.name}</strong> with this verified DealBeez offer.</p>`,
      discountValue: store.bestDiscount || "10% Off",
      discountType: "percentage",
      type: "code",
      code: `${String(store.slug).replace(/-/g, "").slice(0, 6).toUpperCase()}10`,
      verified: true,
      exclusive: false,
      isPublished: true,
      categorySlug: store.categorySlug || "",
      postedBy: "DealBeez",
      postedAt: "Today",
      metaTitle: `${store.name} Coupon Code | DealBeez`,
      metaDescription: `Get ${store.bestDiscount || "savings"} at ${store.name} with a verified promo code.`,
      seoH1: `${store.name} Promo Code`,
    });
    created += 1;
  }

  console.log(`Coupons created: ${created}, skipped: ${skipped}, stores: ${stores.length}`);
  await mongoose.connection.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
