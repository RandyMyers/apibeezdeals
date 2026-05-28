const User = require("../models/User");
const Coupon = require("../models/Coupon");
const CouponComment = require("../models/CouponComment");
const asyncHandler = require("../utils/asyncHandler");
const { serializeComment, serializeCoupon } = require("../utils/serialize");
const { createPublicId } = require("../utils/publicId");
const { assertPublishedCoupon } = require("../utils/assertPublishedCoupon");
const { syncCouponEngagementCounts } = require("../utils/syncCouponStats");

exports.listForCoupon = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  await assertPublishedCoupon(couponPublicId);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const skip = Math.min(Number(req.query.skip) || 0, 5000);
  const docs = await CouponComment.find({ couponPublicId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const userIds = [...new Set(docs.map((d) => String(d.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  res.json({
    comments: docs.map((d) => serializeComment(d, byId.get(String(d.userId)))),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  await assertPublishedCoupon(couponPublicId);
  const body = String(req.body?.body || "").trim();
  if (!body) {
    const err = new Error("body is required");
    err.status = 400;
    throw err;
  }
  const doc = await CouponComment.create({
    publicId: createPublicId("cm"),
    couponPublicId,
    userId: req.user._id,
    body,
  });
  await syncCouponEngagementCounts(couponPublicId);
  const author = await User.findById(req.user._id).lean();
  const coupon = await Coupon.findOne({ publicId: couponPublicId }).lean();
  res.status(201).json({
    comment: serializeComment(doc, author),
    coupon: coupon ? serializeCoupon(coupon) : undefined,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  const doc = await CouponComment.findOne({
    publicId: req.params.commentId,
    couponPublicId,
    userId: req.user._id,
    isDeleted: false,
  });
  if (!doc) {
    const err = new Error("Comment not found");
    err.status = 404;
    throw err;
  }
  const body = String(req.body?.body || "").trim();
  if (!body) {
    const err = new Error("body is required");
    err.status = 400;
    throw err;
  }
  doc.body = body;
  doc.editedAt = new Date();
  await doc.save();
  await syncCouponEngagementCounts(couponPublicId);
  const author = await User.findById(req.user._id).lean();
  res.json({ comment: serializeComment(doc, author) });
});

exports.remove = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  const doc = await CouponComment.findOne({
    publicId: req.params.commentId,
    couponPublicId,
    userId: req.user._id,
    isDeleted: false,
  });
  if (!doc) {
    const err = new Error("Comment not found");
    err.status = 404;
    throw err;
  }
  doc.isDeleted = true;
  await doc.save();
  await syncCouponEngagementCounts(couponPublicId);
  const coupon = await Coupon.findOne({ publicId: couponPublicId }).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  res.json({ ok: true, coupon: serializeCoupon(coupon) });
});
