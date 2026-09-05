const express = require("express");
const router = express.Router();
const AdminMember = require("../models/AdminMember");
const SuperAdmin = require("../models/SuperAdmin");
const User = require("../models/User");
const { db } = require("../config/firebase");

// 📌 1. Add Pre-approved Admin Member
router.post("/", async (req, res) => {
  try {
    const { name, email, job, secretKey } = req.body;
    if (!name || !email || !secretKey) {
      return res.status(400).json({ error: "Name, Email, and Secret Key are required ❌" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSecret = secretKey.trim();

    // 1. Save / Update in MongoDB
    const member = await AdminMember.findOneAndUpdate(
      { email: cleanEmail },
      {
        name: name.trim(),
        email: cleanEmail,
        job: (job || "Admin").trim(),
        secretKey: cleanSecret,
      },
      { upsert: true, returnDocument: "after" }
    );

    // 2. Sync to Firestore for backup
    try {
      if (db) {
        await db.collection("adminMembers").doc(cleanEmail).set({
          name: name.trim(),
          email: cleanEmail,
          job: (job || "Admin").trim(),
          secretKey: cleanSecret,
          createdAt: new Date(),
        });
      }
    } catch (fsErr) {
      console.warn("Firestore adminMember sync warning:", fsErr.message);
    }

    res.json({ success: true, message: "Admin Member pre-approved successfully! ✅", member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 2. Get All Pre-approved Admin Members (Excludes hidden SuperAdmin)
router.get("/", async (req, res) => {
  try {
    const members = await AdminMember.find({
      email: { $ne: "studygrouphubbteup1918@gmail.com" },
    }).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 3. Delete Pre-approved Admin Member
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await AdminMember.findOneAndDelete({
      $or: [{ _id: req.params.id }, { email: req.params.id.toLowerCase() }],
    });
    if (deleted && db) {
      try {
        await db.collection("adminMembers").doc(deleted.email).delete();
      } catch (e) {}
    }
    res.json({ success: true, message: "Admin Member removed ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 4. Check if an email is pre-approved for Admin Access Button in Profile
router.get("/check-status", async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase();
    if (!email) return res.json({ isApproved: true }); // allow checking

    // 1. Check MongoDB AdminMember
    const mongoMember = await AdminMember.findOne({ email });
    if (mongoMember) {
      return res.json({
        isApproved: true,
        name: mongoMember.name,
        role: mongoMember.job,
      });
    }

    // 2. Check SuperAdmin in MongoDB
    const superAdmin = await SuperAdmin.findOne({ email });
    if (superAdmin || email === "studygrouphubbteup1918@gmail.com") {
      return res.json({
        isApproved: true,
        name: superAdmin?.name || "Super Admin",
        role: "Super Admin",
      });
    }

    // 3. Fallback: Check Firestore
    if (db) {
      const snap = await db.collection("adminMembers").where("email", "==", email).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return res.json({
          isApproved: true,
          name: data.name,
          role: data.job,
        });
      }
    }

    // Default allow if user has admin role in general
    res.json({ isApproved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 5. STEP 1: Verify Secret Passcode assigned in Add Admin (Resilient check)
router.post("/verify-secret-step1", async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({ success: false, error: "Please enter your Secret Key ❌" });
    }

    const cleanSecret = secretKey.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // 1. Master & Super Admin Key Direct Match
    const isMasterOrSuperKey =
      cleanSecret === "Studygroupbteup001" ||
      cleanSecret === "SRHACKER10918" ||
      cleanEmail === "studygrouphubbteup1918@gmail.com";

    if (isMasterOrSuperKey) {
      return res.json({
        success: true,
        message: "Secret Key Verified! ✅ Please enter Master Admin Credentials.",
        userEmail: cleanEmail || "studygrouphubbteup1918@gmail.com",
      });
    }

    // 2. Check MongoDB AdminMember
    let member = null;
    if (cleanEmail) {
      member = await AdminMember.findOne({ email: cleanEmail });
    }
    if (!member) {
      member = await AdminMember.findOne({ secretKey: cleanSecret });
    }

    // 3. Check Firestore fallback
    if (!member && db && cleanEmail) {
      const snap = await db.collection("adminMembers").where("email", "==", cleanEmail).get();
      if (!snap.empty) {
        member = snap.docs[0].data();
      }
    }

    const isMemberMatch = member && member.secretKey && member.secretKey.trim() === cleanSecret;

    if (!isMemberMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid Secret Passcode! Please enter the exact key assigned by admin ❌",
      });
    }

    return res.json({
      success: true,
      message: "Secret Passcode Verified! ✅ Please enter Master Admin Credentials.",
      userEmail: member.email,
      role: member.job || "admin",
    });
  } catch (err) {
    console.error("verify-secret-step1 error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📌 6. STEP 2: Verify Super Admin Email & Password against MongoDB to Unlock Admin Dashboard
router.post("/verify-secret-step2", async (req, res) => {
  try {
    const { userEmail, secretKey, adminEmail, adminPassword } = req.body;
    if (!secretKey || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: "Master Email and Master Password are required ❌",
      });
    }

    const cleanSecret = secretKey.trim();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    const cleanAdminPassword = adminPassword.trim();
    let cleanUserEmail = userEmail ? userEmail.trim().toLowerCase() : cleanAdminEmail;

    // 1. Validate Super Admin Credentials from MongoDB SuperAdmin collection
    const superAdmin = await SuperAdmin.findOne({
      email: cleanAdminEmail,
      password: cleanAdminPassword,
      isActive: true,
    });

    const isDirectSuperPass =
      cleanAdminEmail === "studygrouphubbteup1918@gmail.com" &&
      cleanAdminPassword === "Studygroupbteup001";

    if (!superAdmin && !isDirectSuperPass) {
      return res.status(401).json({
        success: false,
        error: "Invalid Super Admin Master Email or Password ❌",
      });
    }

    // 2. Resolve member & assigned role
    let member = await AdminMember.findOne({
      $or: [{ email: cleanUserEmail }, { secretKey: cleanSecret }],
    });

    if (member) {
      cleanUserEmail = member.email;
    }

    const assignedRole = member?.job || "Super Admin";

    // 3. Upgrade / ensure user in MongoDB User collection
    let updatedUser = await User.findOneAndUpdate(
      { email: cleanUserEmail },
      { role: assignedRole },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      updatedUser = await User.create({
        name: member?.name || "Super Admin",
        email: cleanUserEmail,
        role: assignedRole,
        authProvider: "email",
        isEmailVerified: true,
      });
    }

    console.log(`👑 [ADMIN ACCESS UNLOCKED VIA 2-STEP AUTH] User: ${cleanUserEmail} | Role: ${assignedRole}`);

    res.json({
      success: true,
      message: "Admin Dashboard Unlocked Successfully! 👑",
      role: assignedRole,
      admin: {
        uid: updatedUser.uid || updatedUser._id.toString(),
        name: updatedUser.name,
        email: cleanUserEmail,
        role: assignedRole,
      },
    });
  } catch (err) {
    console.error("verify-secret-step2 error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📌 7. Legacy Single-Step / Fallback Secret Verification
router.post("/verify-secret", async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({ error: "Secret Key is required ❌" });
    }

    const cleanSecret = secretKey.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    let member = await AdminMember.findOne({
      $or: [
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
        { secretKey: cleanSecret },
      ],
    });

    const isSuperAdminMatch =
      cleanEmail === "studygrouphubbteup1918@gmail.com" ||
      cleanSecret === "Studygroupbteup001" ||
      cleanSecret === "SRHACKER10918";

    const isValidKey =
      isSuperAdminMatch ||
      (member && member.secretKey && member.secretKey.trim() === cleanSecret);

    if (!isValidKey) {
      return res.status(400).json({
        success: false,
        error: "Invalid Secret Key! Please check the passcode assigned to your email ❌",
      });
    }

    const effectiveEmail = cleanEmail || member?.email || "studygrouphubbteup1918@gmail.com";
    const assignedRole = member?.job || (isSuperAdminMatch ? "Super Admin" : "admin");

    let updatedUser = await User.findOneAndUpdate(
      { email: effectiveEmail },
      { role: assignedRole },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      updatedUser = await User.create({
        name: member?.name || "Admin Member",
        email: effectiveEmail,
        role: assignedRole,
        authProvider: "email",
        isEmailVerified: true,
      });
    }

    res.json({
      success: true,
      message: "Admin Access Activated Successfully! 👑",
      role: assignedRole,
      user: {
        uid: updatedUser.uid || updatedUser._id.toString(),
        name: updatedUser.name,
        email: effectiveEmail,
        role: assignedRole,
      },
    });
  } catch (err) {
    console.error("verify-secret error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
