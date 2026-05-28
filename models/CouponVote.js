const mongoose = require("mongoose");

/** At most one vote per user per coupon; value +1 (up) or -1 (down). */
const couponVoteSchema = new mongoose.Schema(
  {
    couponPublicId: { type: String, required: true, index: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true }
);

couponVoteSchema.index({ couponPublicId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("CouponVote", couponVoteSchema);
