const Store = require("../models/Store");
const Coupon = require("../models/Coupon");
const asyncHandler = require("../utils/asyncHandler");
const { serializeStore } = require("../utils/serialize");
const { withCountryConstraint } = require("../utils/countryQuery");

const DEFAULT_TRENDING = [
  "Amazon promo codes",
  "Nike coupons",
  "Target deals",
  "Best Buy discounts",
  "Walmart rollbacks",
  "Adidas outlet codes",
  "Sephora free samples",
  "Home Depot savings",
];

/** Store name + coupon title matches for navbar / modal search. */
exports.suggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 8, 20);

  if (!q) {
    return res.json({ stores: [], coupons: [] });
  }

  const storeRx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const storeBase = {
    isPublished: true,
    $or: [{ name: storeRx }, { slug: storeRx }],
  };
  const couponBase = {
    isPublished: true,
    $or: [
      { title: storeRx },
      { storeName: storeRx },
      { description: storeRx },
    ],
  };
  const country = req.query.country;
  const storeFilter = withCountryConstraint(storeBase, country);
  const couponFilter = withCountryConstraint(couponBase, country);

  const stores = await Store.find(storeFilter)
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  const coupons = await Coupon.find(couponFilter)
    .sort({ upvotes: -1 })
    .limit(limit)
    .lean();

  res.json({
    stores: stores.map((s) => serializeStore(s)),
    coupons: coupons.map((c) => ({
      id: c.publicId,
      title: c.title,
      storeName: c.storeName,
      storeSlug: c.storeSlug,
    })),
  });
});

exports.trending = asyncHandler(async (req, res) => {
  const fromDb = await Coupon.distinct("title", { isPublished: true }).then((titles) =>
    titles.slice(0, 8)
  );
  const terms = fromDb.length >= 4 ? fromDb : DEFAULT_TRENDING;
  res.json({ terms });
});
