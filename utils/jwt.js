const jwt = require("jsonwebtoken");

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is required");
  return s;
};

function signUserToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      pid: user.publicId,
      role: user.role,
    },
    SECRET(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "14d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET());
}

module.exports = { signUserToken, verifyToken };
