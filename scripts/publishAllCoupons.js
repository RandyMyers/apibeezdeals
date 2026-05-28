/**
 * Mark all coupons as published for sitemap inclusion.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const res = await Coupon.updateMany({}, { $set: { isPublished: true } });
  console.log(`Published ${res.modifiedCount} coupons`);
  await mongoose.connection.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
