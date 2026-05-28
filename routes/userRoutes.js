const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.patch("/me", userController.updateMe);

router.get("/me/liked-coupons", userController.listLikedCoupons);
router.post("/me/liked-coupons/:couponPublicId", userController.addLike);
router.delete("/me/liked-coupons/:couponPublicId", userController.removeLike);

router.get("/me/savings", userController.listSavings);
router.post("/me/savings", userController.createSaving);
router.get("/me/savings/:publicId", userController.getSaving);
router.put("/me/savings/:publicId", userController.updateSaving);
router.delete("/me/savings/:publicId", userController.deleteSaving);

router.get("/me/comments", userController.listMyComments);

module.exports = router;
