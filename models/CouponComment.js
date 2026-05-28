const mongoose = require("mongoose");

const couponCommentSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, index: true, trim: true },
    couponPublicId: { type: String, required: true, index: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

couponCommentSchema.index({ couponPublicId: 1, createdAt: -1 });

module.exports = mongoose.model("CouponComment", couponCommentSchema);
