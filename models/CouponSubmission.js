const mongoose = require("mongoose");

/**
 * Logged-in user proposes a coupon for a store that must already exist in catalog.
 * Admin approves/rejects; publishing to Coupon can be manual or automated later.
 */
const couponSubmissionSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userPublicId: { type: String, required: true, trim: true },
    storePublicId: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 400 },
    description: { type: String, default: "", maxlength: 8000 },
    code: { type: String, default: "", trim: true, maxlength: 120 },
    discountValue: { type: String, default: "", trim: true, maxlength: 80 },
    type: { type: String, enum: ["code", "deal", "sale"], default: "code" },
    status: {
      type: String,
      enum: ["pending", "reviewing", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, default: "", maxlength: 2000 },
    /** Set when admin approves and a catalog coupon is created from this submission. */
    createdCouponPublicId: { type: String, default: "", trim: true, index: true },
  },
  { timestamps: true }
);

couponSubmissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("CouponSubmission", couponSubmissionSchema);
