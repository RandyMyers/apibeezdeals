const CouponLike = require("../models/CouponLike");
const CouponVote = require("../models/CouponVote");
const { serializeCoupon } = require("./serialize");

/**
 * Batch-load like + vote rows for a user across many coupons (two queries).
 * @param {import("mongoose").Types.ObjectId|string} userId
 * @param {Array<{ publicId?: string }>} couponsLean
 * @returns {{ likeSet: Set<string>, voteMap: Map<string, number> }}
 */
async function loadUserEngagementForCoupons(userId, couponsLean) {
  const publicIds = [
    ...new Set(
      (couponsLean || []).map((c) => c.publicId).filter(Boolean)
    ),
  ];
  if (!userId || !publicIds.length) {
    return { likeSet: new Set(), voteMap: new Map() };
  }
  const [likes, votes] = await Promise.all([
    CouponLike.find({ userId, couponPublicId: { $in: publicIds } })
      .select("couponPublicId")
      .lean(),
    CouponVote.find({ userId, couponPublicId: { $in: publicIds } })
      .select("couponPublicId value")
      .lean(),
  ]);
  return {
    likeSet: new Set(likes.map((l) => l.couponPublicId)),
    voteMap: new Map(votes.map((v) => [v.couponPublicId, v.value])),
  };
}

/**
 * Serialize coupon list; when `reqUser` is set, attach `isLiked` and `myVote` per row.
 * @param {Array<object>} couponsLean
 * @param {object|null|undefined} reqUser lean user with `_id`
 * @returns {Promise<object[]>}
 */
async function serializeCouponsForRequester(couponsLean, reqUser) {
  const coupons = couponsLean || [];
  if (!reqUser?._id) {
    return coupons.map((c) => serializeCoupon(c));
  }
  const { likeSet, voteMap } = await loadUserEngagementForCoupons(
    reqUser._id,
    coupons
  );
  return coupons.map((c) =>
    serializeCoupon(c, {
      isLiked: likeSet.has(c.publicId),
      myVote: voteMap.has(c.publicId) ? voteMap.get(c.publicId) : null,
    })
  );
}

module.exports = { serializeCouponsForRequester, loadUserEngagementForCoupons };
