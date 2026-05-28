const Coupon = require("../models/Coupon");
const CouponVote = require("../models/CouponVote");
const asyncHandler = require("../utils/asyncHandler");
const { serializeCoupon } = require("../utils/serialize");
const { assertPublishedCoupon } = require("../utils/assertPublishedCoupon");
const { syncCouponEngagementCounts } = require("../utils/syncCouponStats");

exports.upsert = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  await assertPublishedCoupon(couponPublicId);
  const val = Number(req.body?.value);
  if (![1, -1].includes(val)) {
    const err = new Error("body.value must be 1 or -1");
    err.status = 400;
    throw err;
  }
  await CouponVote.findOneAndUpdate(
    { couponPublicId, userId: req.user._id },
    { $set: { value: val } },
    { upsert: true, new: true }
  );
  await syncCouponEngagementCounts(couponPublicId);
  const coupon = await Coupon.findOne({ publicId: couponPublicId }).lean();
  res.json({ ok: true, coupon: serializeCoupon(coupon, { myVote: val }) });
});

exports.removeMine = asyncHandler(async (req, res) => {
  const couponPublicId = req.params.id;
  await CouponVote.deleteOne({ couponPublicId, userId: req.user._id });
  await syncCouponEngagementCounts(couponPublicId);
  const coupon = await Coupon.findOne({ publicId: couponPublicId }).lean();
  if (!coupon) {
    const err = new Error("Coupon not found");
    err.status = 404;
    throw err;
  }
  res.json({ ok: true, coupon: serializeCoupon(coupon, { myVote: null }) });
});
