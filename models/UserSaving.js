const mongoose = require("mongoose");

/** User-reported savings entry (optionally tied to a coupon). */
const userSavingSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, index: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    couponPublicId: { type: String, default: "", trim: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    label: { type: String, default: "", trim: true, maxlength: 200 },
    note: { type: String, default: "", trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

userSavingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("UserSaving", userSavingSchema);
