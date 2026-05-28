const mongoose = require("mongoose");

/** One row per view event; Coupon.views is a denormalised count of these rows. */
const couponViewSchema = new mongoose.Schema(
  {
    couponPublicId: { type: String, required: true, index: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    /** Anonymous client key (e.g. session id) when not logged in. */
    anonKey: { type: String, default: "", index: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

couponViewSchema.index({ couponPublicId: 1, createdAt: -1 });

module.exports = mongoose.model("CouponView", couponViewSchema);
