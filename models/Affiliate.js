const mongoose = require("mongoose");

/** Minimal affiliate record (expand toward DealCouponz parity: payouts, tiers, links). */
const affiliateSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    trackingCode: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 64 },
    contactEmail: { type: String, default: "", trim: true, lowercase: true, maxlength: 320 },
    notes: { type: String, default: "", maxlength: 4000 },
    commissionPercent: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Affiliate", affiliateSchema);
