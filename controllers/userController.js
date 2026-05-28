const User = require("../models/User");
const Coupon = require("../models/Coupon");
const CouponLike = require("../models/CouponLike");
const UserSaving = require("../models/UserSaving");
const CouponComment = require("../models/CouponComment");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword } = require("../utils/password");
const { createPublicId } = require("../utils/publicId");
const {
  serializeUser,
  serializeCoupon,
  serializeSaving,
  serializeComment,
} = require("../utils/serialize");

exports.updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name != null) updates.name = String(req.body.name).trim();
  if (req.body.email != null) {
    const e = String(req.body.email).toLowerCase().trim();
    const taken = await User.findOne({ email: e, _id: { $ne: req.user._id } });
    if (taken) {
      const err = new Error("Email already in use");
      err.status = 409;
      throw err;
    }
    updates.email = e;
  }
  if (req.body.password) {
    updates.passwordHash = await hashPassword(String(req.body.password));
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error("No valid fields to update");
    err.status = 400;
    throw err;
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
    new: true,
  }).lean();
  res.json({ user: serializeUser(user) });
});

exports.listLikedCoupons = asyncHandler(async (req, res) => {
  const likes = await CouponLike.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  const ids = likes.map((l) => l.couponPublicId);
  const coupons = await Coupon.find({
    publicId: { $in: ids },
    isPublished: true,
  }).lean();
  const order = new Map(ids.map((id, i) => [id, i]));
  coupons.sort((a, b) => (order.get(a.publicId) ?? 0) - (order.get(b.publicId) ?? 0));
  res.json({ coupons: coupons.map((c) => serializeCoupon(c, { isLiked: true })) });
});

exports.addLike = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.couponPublicId;
  const coupon = await Coupon.findOne({ publicId: couponPublicId, isPublished: true });
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  await CouponLike.updateOne(
    { couponPublicId, userId: req.user._id },
    { $setOnInsert: { couponPublicId, userId: req.user._id } },
    { upsert: true }
  );
  const fresh = await Coupon.findOne({ publicId: couponPublicId, isPublished: true }).lean();
  res.status(201).json({
    ok: true,
    coupon: fresh ? serializeCoupon(fresh, { isLiked: true }) : undefined,
  });
});

exports.removeLike = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.couponPublicId;
  await CouponLike.deleteOne({
    couponPublicId,
    userId: req.user._id,
  });
  const fresh = await Coupon.findOne({ publicId: couponPublicId, isPublished: true }).lean();
  res.json({
    ok: true,
    coupon: fresh ? serializeCoupon(fresh, { isLiked: false }) : undefined,
  });
});

exports.listSavings = asyncHandler(async (req, res) => {
  const rows = await UserSaving.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ savings: rows.map(serializeSaving) });
});

exports.createSaving = asyncHandler(async (req, res) => {
  const { amount, currency, label, note, couponPublicId } = req.body || {};
  if (amount == null || Number.isNaN(Number(amount))) {
    const err = new Error("amount is required (number)");
    err.status = 400;
    throw err;
  }
  if (couponPublicId) {
    const c = await Coupon.findOne({ publicId: String(couponPublicId), isPublished: true });
    if (!c) {
      const err = new Error("Coupon not found");
      err.status = 404;
      throw err;
    }
  }
  const row = await UserSaving.create({
    publicId: createPublicId("sv"),
    userId: req.user._id,
    couponPublicId: couponPublicId ? String(couponPublicId) : "",
    amount: Number(amount),
    currency: currency ? String(currency).toUpperCase().slice(0, 8) : "USD",
    label: label != null ? String(label).slice(0, 200) : "",
    note: note != null ? String(note).slice(0, 4000) : "",
  });
  res.status(201).json({ saving: serializeSaving(row) });
});

exports.getSaving = asyncHandler(async (req, res) => {
  const row = await UserSaving.findOne({
    publicId: req.params.publicId,
    userId: req.user._id,
  }).lean();
  if (!row) {
    const err = new Error("Saving not found");
    err.status = 404;
    throw err;
  }
  res.json({ saving: serializeSaving(row) });
});

exports.updateSaving = asyncHandler(async (req, res) => {
  const row = await UserSaving.findOne({
    publicId: req.params.publicId,
    userId: req.user._id,
  });
  if (!row) {
    const err = new Error("Saving not found");
    err.status = 404;
    throw err;
  }
  const { amount, currency, label, note, couponPublicId } = req.body || {};
  if (amount != null) row.amount = Number(amount);
  if (currency != null) row.currency = String(currency).toUpperCase().slice(0, 8);
  if (label != null) row.label = String(label).slice(0, 200);
  if (note != null) row.note = String(note).slice(0, 4000);
  if (couponPublicId !== undefined) {
    const cp = couponPublicId ? String(couponPublicId) : "";
    if (cp) {
      const c = await Coupon.findOne({ publicId: cp, isPublished: true });
      if (!c) {
        const err = new Error("Coupon not found");
        err.status = 404;
        throw err;
      }
    }
    row.couponPublicId = cp;
  }
  await row.save();
  res.json({ saving: serializeSaving(row) });
});

exports.deleteSaving = asyncHandler(async (req, res) => {
  const r = await UserSaving.deleteOne({
    publicId: req.params.publicId,
    userId: req.user._id,
  });
  if (r.deletedCount === 0) {
    const err = new Error("Saving not found");
    err.status = 404;
    throw err;
  }
  res.status(204).send();
});

exports.listMyComments = asyncHandler(async (req, res) => {
  const docs = await CouponComment.find({ userId: req.user._id, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const author = req.user;
  const pids = [...new Set(docs.map((d) => d.couponPublicId).filter(Boolean))];
  const coupons = await Coupon.find({ publicId: { $in: pids } })
    .select("publicId title storeName")
    .lean();
  const meta = new Map(coupons.map((c) => [c.publicId, c]));
  res.json({
    comments: docs.map((d) => {
      const c = meta.get(d.couponPublicId);
      return {
        ...serializeComment(d, author),
        couponTitle: c?.title,
        storeName: c?.storeName,
      };
    }),
  });
});
