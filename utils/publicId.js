const crypto = require("crypto");

function createPublicId(prefix = "") {
  const id = crypto.randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

module.exports = { createPublicId };
