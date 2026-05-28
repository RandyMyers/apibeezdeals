const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signUserToken } = require("../utils/jwt");
const { createPublicId } = require("../utils/publicId");
const { serializeUser } = require("../utils/serialize");
const { sendPasswordResetEmail } = require("../utils/email");

exports.register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    const err = new Error("email, password, and name are required");
    err.status = 400;
    throw err;
  }
  if (String(password).length < 8) {
    const err = new Error("password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  const normalized = String(email).toLowerCase().trim();
  const exists = await User.findOne({ email: normalized });
  if (exists) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const user = await User.create({
    publicId: createPublicId("u"),
    email: normalized,
    passwordHash: await hashPassword(String(password)),
    name: String(name).trim(),
  });
  const token = signUserToken(user);
  res.status(201).json({ token, user: serializeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
    "+passwordHash"
  );
  if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  if (user.isActive === false) {
    const err = new Error("This account has been deactivated");
    err.status = 403;
    throw err;
  }
  const token = signUserToken(user);
  const lean = user.toObject ? user.toObject() : user;
  delete lean.passwordHash;
  res.json({ token, user: serializeUser(lean) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

function hashResetToken(raw) {
  return crypto.createHash("sha256").update(String(raw), "utf8").digest("hex");
}

/** Always 200 to avoid email enumeration. */
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "")
    .toLowerCase()
    .trim();
  const user = email
    ? await User.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpires")
    : null;
  if (user) {
    const raw = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashResetToken(raw);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const base =
      String(process.env.CLIENT_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetPath = String(process.env.CLIENT_RESET_PATH || "/reset-password");
    const link = `${base}${resetPath.startsWith("/") ? "" : "/"}${resetPath}?token=${raw}`;
    try {
      const sent = await sendPasswordResetEmail({ to: email, resetLink: link });
      if (!sent && (process.env.NODE_ENV !== "production" || process.env.LOG_PASSWORD_RESET_LINK === "1")) {
        console.info(`[auth] password reset link for ${email}: ${link}`);
      }
    } catch (mailErr) {
      console.error("[auth] password reset email failed:", mailErr.message);
      if (process.env.NODE_ENV !== "production" || process.env.LOG_PASSWORD_RESET_LINK === "1") {
        console.info(`[auth] password reset link for ${email}: ${link}`);
      }
    }
  }
  res.json({ ok: true });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");
  if (!token || !password || password.length < 8) {
    const err = new Error("token and password (min 8 chars) are required");
    err.status = 400;
    throw err;
  }
  const hash = hashResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +passwordHash");
  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.status = 400;
    throw err;
  }
  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = "";
  user.passwordResetExpires = null;
  await user.save();
  const tokenJwt = signUserToken(user);
  res.json({ token: tokenJwt, user: serializeUser(user) });
});
