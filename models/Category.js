const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    couponCount: { type: Number, default: 0 },
    parentSlug: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    seoIntro: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    faqs: [
      {
        question: { type: String, default: "" },
        answer: { type: String, default: "" },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

categorySchema.index({ parentSlug: 1, name: 1 });

module.exports = mongoose.model("Category", categorySchema);
