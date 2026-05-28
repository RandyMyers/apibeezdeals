const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, index: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "blog_editor",
        "seo_editor",
        "content_editor",
        "moderator",
      ],
      default: "user",
    },
    /** Optional permission override; when empty, role defaults apply. */
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    passwordResetTokenHash: { type: String, default: "", select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.index({ passwordResetTokenHash: 1, passwordResetExpires: 1 });

module.exports = mongoose.model("User", userSchema);
