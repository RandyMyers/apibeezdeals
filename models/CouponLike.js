const mongoose = require("mongoose");

/** Saved / liked coupon for a logged-in user. */
const couponLikeSchema = new mongoose.Schema(
  {
    couponPublicId: { type: String, required: true, index: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

couponLikeSchema.index({ couponPublicId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("CouponLike", couponLikeSchema);
