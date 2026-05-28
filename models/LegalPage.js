const mongoose = require("mongoose");

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const legalLocaleBlockSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    faqs: { type: [faqItemSchema], default: [] },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const legalPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      enum: ["terms", "privacy", "faq"],
    },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    faqs: { type: [faqItemSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    languageTranslations: {
      type: Map,
      of: legalLocaleBlockSchema,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LegalPage", legalPageSchema);
