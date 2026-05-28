const Coupon = require("../models/Coupon");
const CouponView = require("../models/CouponView");
const asyncHandler = require("../utils/asyncHandler");
const { assertPublishedCoupon } = require("../utils/assertPublishedCoupon");

exports.record = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  await assertPublishedCoupon(couponPublicId);
  const userId = req.user && req.user._id ? req.user._id : null;
  const anonKey = String(req.body?.anonKey || "").slice(0, 128);
  await CouponView.create({ couponPublicId, userId, anonKey });
  await Coupon.updateOne({ publicId: couponPublicId }, { $inc: { views: 1 } });
  res.status(201).json({ ok: true });
});
