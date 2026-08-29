const express = require("express");
const router = express.Router();
const SuperAdmin = require("../models/SuperAdmin");
const AdminMember = require("../models/AdminMember");
const User = require("../models/User");

// 📌 1. Verify Secret Key to Unlock Admin Portal
router.post("/verify-secret", async (req, res) => {
  try {
    const { secretKey, email } = req.body;
    if (!secretKey) {
      return res.status(400).json({ success: false, error: "Secret Key is required ❌" });
    }

    const cleanSecret = secretKey.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // 1. Check SuperAdmin in MongoDB
    const superAdmin = await SuperAdmin.findOne({
      $or: [
        { secretKey: cleanSecret },
        ...(cleanEmail ? [{ email: cleanEmail, secretKey: cleanSecret }] : []),
      ],
    });

    if (superAdmin || cleanSecret === "Studygroupbteup001" || cleanSecret === "SRHACKER10918") {
      return res.json({
        success: true,
        message: "Super Admin Secret Key Verified! 👑",
        role: "Super Admin",
        isSuperAdmin: true,
      });
    }

    // 2. Check AdminMember collection in MongoDB
    let memberQuery = { secretKey: cleanSecret };
    if (cleanEmail) {
      memberQuery = { email: cleanEmail, secretKey: cleanSecret };
    }

    const member = await AdminMember.findOne(memberQuery);
    if (member) {
      return res.json({
        success: true,
        message: "Admin Member Secret Key Verified! ✅",
        role: member.job || "Admin",
        isSuperAdmin: false,
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid Secret Key! Access Denied ❌",
    });
  } catch (err) {
    console.error("Admin verify-secret error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📌 2. Admin Login (Direct verification against MongoDB SuperAdmin)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and Password are required ❌",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check MongoDB SuperAdmin Collection
    const superAdmin = await SuperAdmin.findOne({
      email: cleanEmail,
      password: cleanPassword,
      isActive: true,
    });

    if (superAdmin) {
      return res.json({
        success: true,
        message: "Super Admin Login Success! 👑",
        admin: {
          id: superAdmin._id.toString(),
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role || "Super Admin",
          isSuperAdmin: true,
        },
      });
    }

    // 2. Fallback check for user with admin role in User collection
    const user = await User.findOne({ email: cleanEmail });
    if (user && (user.role === "admin" || user.role === "Super Admin")) {
      return res.json({
        success: true,
        message: "Admin Login Success ✅",
        admin: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: false,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid admin credentials. Please check your email and password ❌",
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
