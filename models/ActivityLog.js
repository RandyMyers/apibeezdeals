const mongoose = require("mongoose");

/** Client or anonymous page-activity for admin analytics (path + optional geo). */
const activityLogSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, trim: true, index: true },
    path: { type: String, required: true, trim: true, maxlength: 2048 },
    title: { type: String, default: "", trim: true, maxlength: 500 },
    referrer: { type: String, default: "", trim: true, maxlength: 2048 },
    country: { type: String, default: "", trim: true, maxlength: 8 },
    userAgent: { type: String, default: "", maxlength: 512 },
    anonKey: { type: String, default: "", trim: true, maxlength: 128, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userPublicId: { type: String, default: "", trim: true, index: true },
    /** Last-touch affiliate tracking code from URL (?ref= / ?aff=). */
    affiliateCode: { type: String, default: "", trim: true, maxlength: 64, index: true },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
