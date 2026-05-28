/**
 * Loads demo categories, stores, and coupons (idempotent: clears collections first).
 * Usage: `npm run seed` (requires MONGO_URL in `.env`).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Store = require("../models/Store");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const CouponLike = require("../models/CouponLike");
const CouponVote = require("../models/CouponVote");
const CouponView = require("../models/CouponView");
const CouponComment = require("../models/CouponComment");
const UserSaving = require("../models/UserSaving");
const ActivityLog = require("../models/ActivityLog");
const CouponSubmission = require("../models/CouponSubmission");
const Affiliate = require("../models/Affiliate");
const ContactMessage = require("../models/ContactMessage");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const BlogPost = require("../models/BlogPost");
const seed = require("../data/seedCatalog");
const seedBlogPosts = require("../data/seedBlogPosts");

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("Set MONGO_URL in server/.env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  await Promise.all([
    Category.deleteMany({}),
    Store.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({}),
    CouponLike.deleteMany({}),
    CouponVote.deleteMany({}),
    CouponView.deleteMany({}),
    CouponComment.deleteMany({}),
    UserSaving.deleteMany({}),
    ActivityLog.deleteMany({}),
    CouponSubmission.deleteMany({}),
    Affiliate.deleteMany({}),
    ContactMessage.deleteMany({}),
    NewsletterSubscriber.deleteMany({}),
    BlogPost.deleteMany({}),
  ]);
  await Category.insertMany(seed.categories);
  await Store.insertMany(seed.stores);
  await Coupon.insertMany(seed.coupons);
  await BlogPost.insertMany(seedBlogPosts);
  console.log(
    `Seed OK: ${seed.categories.length} categories, ${seed.stores.length} stores, ${seed.coupons.length} coupons, ${seedBlogPosts.length} blog posts`
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
