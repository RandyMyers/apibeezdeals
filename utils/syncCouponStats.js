const Coupon = require("../models/Coupon");
const CouponVote = require("../models/CouponVote");
const CouponComment = require("../models/CouponComment");

/**
 * Recompute vote / comment counters from child collections.
 * `views` on Coupon are updated only via $inc when CouponView rows are recorded.
 */
async function syncCouponEngagementCounts(couponPublicId) {
  const [upvotes, downvotes, comments] = await Promise.all([
    CouponVote.countDocuments({ couponPublicId, value: 1 }),
    CouponVote.countDocuments({ couponPublicId, value: -1 }),
    CouponComment.countDocuments({ couponPublicId, isDeleted: false }),
  ]);
  await Coupon.updateOne(
    { publicId: couponPublicId },
    { $set: { upvotes, downvotes, comments } }
  );
}

module.exports = { syncCouponEngagementCounts };
