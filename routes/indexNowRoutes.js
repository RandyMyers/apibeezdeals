const express = require("express");

const router = express.Router();

router.get("/:key.txt", (req, res) => {
  const envKey = process.env.INDEXNOW_API_KEY;
  if (!envKey || req.params.key !== envKey) {
    return res.status(404).send("Not found");
  }
  res.type("text/plain").send(envKey);
});

module.exports = router;
