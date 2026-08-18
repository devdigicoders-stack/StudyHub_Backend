const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  testUser,
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  signup,
  login,
  sendOTP,
  verifyOTP,
  resetPassword,
} = require("../controllers/userController");

// ➤ TEST
router.get("/", testUser);

// ➤ CRUD
router.post("/add", addUser);
router.get("/all", verifyToken, getUsers);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

// ➤ AUTH
router.post("/signup", signup);
router.post("/login", login);

// ➤ OTP
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
