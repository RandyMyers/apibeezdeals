const Coupon = require("../models/Coupon");
const Store = require("../models/Store");
const CouponComment = require("../models/CouponComment");
const CouponVote = require("../models/CouponVote");
const CouponLike = require("../models/CouponLike");
const CouponView = require("../models/CouponView");
const UserSaving = require("../models/UserSaving");
const asyncHandler = require("../utils/asyncHandler");
const { serializeCoupon } = require("../utils/serialize");
const {
  serializeCouponsForRequester,
} = require("../utils/serializeCouponsForRequester");
const { createPublicId } = require("../utils/publicId");
const { parseListPagination } = require("../utils/listPagination");
const {
  withCountryConstraint,
  restrictedForCountry,
} = require("../utils/countryQuery");
const { normalizeCountriesBody } = require("../utils/normalizeCountriesBody");
const { pickSeoFromBody } = require("../utils/blogPayload");
const { pickCouponI18nFromBody } = require("../utils/couponPayload");

function parseFeatures(val) {
  if (Array.isArray(val)) {
    return val.map((f) => String(f).trim()).filter(Boolean).slice(0, 32);
  }
  if (typeof val === "string") {
    return val
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 32);
  }
  return undefined;
}

const COUPON_FIELDS = [
  "publicId",
  "storePublicId",
  "storeSlug",
  "storeName",
  "storeLogo",
  "title",
  "description",
  "discountValue",
  "discountType",
  "code",
  "type",
  "verified",
  "exclusive",
  "expiresAt",
  "usedCount",
  "successRate",
  "postedBy",
  "postedAt",
  "details",
  "productImage",
  "originalPrice",
  "salePrice",
  "freeShipping",
  "features",
  "categorySlug",
  "isPublished",
];

function pickCouponPayload(body) {
  const out = {};
  for (const k of COUPON_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (body.features !== undefined) {
    out.features = parseFeatures(body.features);
  } else if (body.featuresText !== undefined) {
    out.features = parseFeatures(body.featuresText);
  }
  Object.assign(out, pickSeoFromBody(body || {}));
  const i18n = pickCouponI18nFromBody(body || {});
  if (i18n) out.languageTranslations = i18n;
  if (body.countries !== undefined) out.countries = normalizeCountriesBody(body.countries);
  return out;
}

exports.listAll = asyncHandler(async (req, res) => {
  const { limit, skip } = parseListPagination(req.query);
  const filter = withCountryConstraint({ isPublished: true }, req.query.country);
  const [total, coupons] = await Promise.all([
    Coupon.countDocuments(filter),
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({
    coupons: await serializeCouponsForRequester(coupons, req.user),
    total,
    limit,
    skip,
  });
});

exports.listTrending = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const filter = withCountryConstraint({ isPublished: true }, req.query.country);
  const coupons = await Coupon.find(filter)
    .sort({ views: -1, upvotes: -1 })
    .limit(limit)
    .lean();
  res.json({ coupons: await serializeCouponsForRequester(coupons, req.user) });
});

exports.getByPublicId = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({
    publicId: req.params.id,
    isPublished: true,
  }).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  if (restrictedForCountry(coupon, req.query.country)) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  const store = await Store.findOne({
    publicId: coupon.storePublicId,
    isPublished: true,
  }).lean();
  if (store && restrictedForCountry(store, req.query.country)) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  let isLiked;
  let myVote;
  if (req.user) {
    const like = await CouponLike.findOne({
      couponPublicId: coupon.publicId,
      userId: req.user._id,
    }).lean();
    isLiked = Boolean(like);
    const voteDoc = await CouponVote.findOne({
      couponPublicId: coupon.publicId,
      userId: req.user._id,
    }).lean();
    myVote = voteDoc ? voteDoc.value : null;
  }
  res.json({ coupon: serializeCoupon(coupon, { isLiked, myVote }) });
});

exports.listByCategorySlug = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const { limit, skip } = parseListPagination(req.query);
  const filter = withCountryConstraint(
    { categorySlug: slug, isPublished: true },
    req.query.country
  );
  const [total, coupons] = await Promise.all([
    Coupon.countDocuments(filter),
    Coupon.find(filter).sort({ upvotes: -1 }).skip(skip).limit(limit).lean(),
  ]);
  res.json({
    coupons: await serializeCouponsForRequester(coupons, req.user),
    total,
    limit,
    skip,
  });
});

/** Admin / API key — create coupon (publicId generated if omitted). */
exports.create = asyncHandler(async (req, res) => {
  const body = pickCouponPayload(req.body || {});
  if (!body.storePublicId || !body.storeSlug || !body.storeName || !body.title) {
    const err = new Error("storePublicId, storeSlug, storeName, and title are required");
    err.status = 400;
    throw err;
  }
  if (!body.publicId) body.publicId = createPublicId("c");
  const exists = await Coupon.findOne({ publicId: body.publicId });
  if (exists) {
    const err = new Error("Coupon publicId already exists");
    err.status = 409;
    throw err;
  }
  const coupon = await Coupon.create({
    views: 0,
    upvotes: 0,
    downvotes: 0,
    comments: 0,
    ...body,
  });
  const serialized = serializeCoupon(coupon.toObject());
  res.status(201).json({ coupon: serialized });
  try {
    const { notifyCouponPublished } = require("../utils/indexNow");
    notifyCouponPublished(coupon.toObject(), req);
  } catch {
    /* non-blocking */
  }
});

/** Admin / API key — replace fields on coupon by publicId. */
exports.update = asyncHandler(async (req, res) => {
  const updates = pickCouponPayload(req.body || {});
  delete updates.publicId;
  const coupon = await Coupon.findOneAndUpdate(
    { publicId: req.params.id },
    { $set: updates },
    { new: true }
  ).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  res.json({ coupon: serializeCoupon(coupon) });
  try {
    const { notifyCouponPublished } = require("../utils/indexNow");
    notifyCouponPublished(coupon, req);
  } catch {
    /* non-blocking */
  }
});

async function deleteCouponDependents(publicIds) {
  const pids = [...new Set((publicIds || []).filter(Boolean))];
  if (!pids.length) return;
  await Promise.all([
    CouponComment.deleteMany({ couponPublicId: { $in: pids } }),
    CouponVote.deleteMany({ couponPublicId: { $in: pids } }),
    CouponLike.deleteMany({ couponPublicId: { $in: pids } }),
    CouponView.deleteMany({ couponPublicId: { $in: pids } }),
    UserSaving.deleteMany({ couponPublicId: { $in: pids } }),
  ]);
}

/** Admin / API key — remove coupon and dependent engagement rows. */
exports.destroy = asyncHandler(async (req, res) => {
  const pid = req.params.id;
  const existing = await Coupon.findOne({ publicId: pid });
  if (!existing) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  await deleteCouponDependents([pid]);
  await Coupon.deleteOne({ publicId: pid });
  res.status(204).send();
});

/** Admin — delete every coupon/deal and related engagement (stores unchanged). */
exports.destroyAll = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}, { publicId: 1 }).lean();
  const publicIds = coupons.map((c) => c.publicId).filter(Boolean);
  if (!publicIds.length) {
    return res.json({ deleted: 0 });
  }
  await deleteCouponDependents(publicIds);
  const result = await Coupon.deleteMany({});
  res.json({ deleted: result.deletedCount ?? publicIds.length });
});
