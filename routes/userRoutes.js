const express = require("express");
const router = express.Router();

const {
  testUser,
  addUser,
  getUsers,
  getUserProfile,
  updateUser,
  deleteUser,
  signup,
  login,
  sendSignupOTP,
  verifySignupOTP,
  sendOTP,
  verifyOTP,
  resetPassword,
  syncUser,
} = require("../controllers/userController");

// ➤ TEST
router.get("/", testUser);

// ➤ CRUD & PROFILE
router.post("/add", addUser);
router.get("/all", getUsers);
router.get("/list", getUsers);
router.get("/profile/:id", getUserProfile);
router.put("/update-profile", updateUser);
router.post("/update-profile", updateUser);
router.put("/update", updateUser);
router.post("/update", updateUser);
router.put("/update/:id", updateUser);
router.post("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

// ➤ AUTH
router.post("/signup", signup);
router.post("/login", login);
router.post("/sync", syncUser);

// ➤ SIGNUP EMAIL OTP VERIFICATION
router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp", verifySignupOTP);

// ➤ PASSWORD RESET OTP
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
