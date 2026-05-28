const mongoose = require("mongoose");

/** Unique site visitors (keyed by anon tracking id + enriched geo/device). */
const visitorSchema = new mongoose.Schema(
  {
    trackingKey: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userPublicId: { type: String, default: "", trim: true, index: true },
    country: { type: String, default: "", trim: true, maxlength: 120 },
    countryCode: { type: String, default: "", trim: true, maxlength: 8, index: true },
    city: { type: String, default: "", trim: true, maxlength: 120 },
    region: { type: String, default: "", trim: true, maxlength: 120 },
    deviceType: { type: String, default: "", trim: true, maxlength: 32 },
    platform: { type: String, default: "", trim: true, maxlength: 64 },
    browserLanguage: { type: String, default: "", trim: true, maxlength: 16 },
    userAgent: { type: String, default: "", maxlength: 512 },
    visitCount: { type: Number, default: 1, min: 1 },
    lastPath: { type: String, default: "", trim: true, maxlength: 2048 },
    lastTitle: { type: String, default: "", trim: true, maxlength: 500 },
    affiliateCode: { type: String, default: "", trim: true, maxlength: 64 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

visitorSchema.index({ lastSeenAt: -1 });

module.exports = mongoose.model("Visitor", visitorSchema);
