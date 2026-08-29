const User = require("../models/User");
const mongoose = require("mongoose");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const axios = require("axios");
const nodemailer = require("nodemailer");

// 👉 FAST PERSISTENT EMAIL CONNECTION POOL
const fastMailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 14,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection once on start
fastMailTransporter.verify((err) => {
  if (err) {
    console.warn("⚠️ SMTP Fast Pool Note:", err.message);
  } else {
    console.log("⚡ Fast Email Delivery Pool Ready ✅ (Instant OTP dispatch enabled)");
  }
});

// 👉 OTP TEMP STORAGE
let otpStore = {};
let signupOtpStore = {};

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const email in signupOtpStore) {
    if (signupOtpStore[email].expiresAt < now) {
      delete signupOtpStore[email];
    }
  }
  for (const email in otpStore) {
    if (otpStore[email].expiresAt && otpStore[email].expiresAt < now) {
      delete otpStore[email];
    }
  }
}, 5 * 60 * 1000);

// ➤ TEST
const testUser = (req, res) => {
  res.send("Users route working with MongoDB ✅");
};

// ➤ ADD USER
const addUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.json({ id: newUser._id, message: "User Added to MongoDB ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ GET USERS (Combined MongoDB + Firebase)
const getUsers = async (req, res) => {
  try {
    const mongoUsers = await User.find().sort({ createdAt: -1 });
    let allUsers = mongoUsers.map((u) => u.toJSON ? u.toJSON() : u);

    // Also get Firebase users if any exist that are not yet in Mongo
    try {
      if (admin.apps.length) {
        const listUsersResult = await admin.auth().listUsers(100);
        const existingEmails = new Set(allUsers.map((u) => u.email?.toLowerCase()));

        listUsersResult.users.forEach((fbUser) => {
          if (fbUser.email && !existingEmails.has(fbUser.email.toLowerCase())) {
            allUsers.push({
              _id: fbUser.uid,
              id: fbUser.uid,
              uid: fbUser.uid,
              name: fbUser.displayName || "Firebase User",
              email: fbUser.email,
              role: "user",
              authProvider: fbUser.providerData?.[0]?.providerId === "google.com" ? "google" : "firebase",
              isEmailVerified: fbUser.emailVerified,
              createdAt: fbUser.metadata.creationTime || new Date(),
            });
          }
        });
      }
    } catch (fbErr) {
      console.warn("Firebase listUsers note:", fbErr.message);
    }

    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ GET USER PROFILE (By ID, UID, or Email)
const getUserProfile = async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId) {
      return res.status(400).json({ error: "User identifier required" });
    }

    const orConditions = [];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      orConditions.push({ _id: rawId });
    }
    orConditions.push({ uid: rawId });
    orConditions.push({ email: rawId.toLowerCase() });

    const user = await User.findOne({ $or: orConditions });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ UPDATE USER (Cast-Safe find & update)
const updateUser = async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    const bodyEmail = (req.body.email || "").trim().toLowerCase();
    const bodyUid = (req.body.uid || "").trim();

    const orConditions = [];
    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
      orConditions.push({ _id: rawId });
    }
    if (rawId && rawId.includes("@")) {
      orConditions.push({ email: rawId.toLowerCase() });
    } else if (rawId) {
      orConditions.push({ uid: rawId });
    }
    if (bodyUid) {
      orConditions.push({ uid: bodyUid });
    }
    if (bodyEmail) {
      orConditions.push({ email: bodyEmail });
    }

    if (orConditions.length === 0) {
      return res.status(400).json({ error: "No valid user identifier provided" });
    }

    // Clean update data - NEVER include _id or id in update payload
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    if (bodyEmail) updateData.email = bodyEmail;

    const updatedUser = await User.findOneAndUpdate(
      { $or: orConditions },
      updateData,
      { returnDocument: "after", upsert: true }
    );

    res.json({ message: "Profile Updated Successfully ✅", user: updatedUser });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ DELETE USER (Cast-Safe delete)
const deleteUser = async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    const orConditions = [];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      orConditions.push({ _id: rawId });
    }
    if (rawId) {
      orConditions.push({ uid: rawId });
      orConditions.push({ email: rawId.toLowerCase() });
    }

    await User.findOneAndDelete({
      $or: orConditions.length > 0 ? orConditions : [{ email: "impossible_user" }],
    });
    res.json({ message: "User Deleted from MongoDB ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ SIGNUP (Direct legacy or fallback)
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "").trim() || "Student";

    const userRecord = await admin.auth().createUser({
      email: cleanEmail,
      password,
      displayName: cleanName,
    });

    await User.create({
      name: cleanName,
      email: cleanEmail,
      uid: userRecord.uid,
      role: "user",
      authProvider: "email",
    });

    res.json({ message: "User Registered in MongoDB ✅", uid: userRecord.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const API_KEY = process.env.FIREBASE_API_KEY;

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      },
    );

    res.json({
      message: "Login Success ✅",
      token: response.data.idToken,
    });
  } catch (err) {
    res.status(400).json({ error: err.response?.data || err.message });
  }
};

// ================= SIGNUP EMAIL OTP SYSTEM =================

// ➤ SEND SIGNUP OTP (ULTRA-FAST DISPATCH)
const sendSignupOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Name and Email are required ❌" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address ❌" });
    }

    // 2. Prevent common domain typos (e.g. @gamil.com instead of @gmail.com)
    const emailParts = cleanEmail.split("@");
    const domain = emailParts[1];
    const commonTypos = {
      "gamil.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmal.com": "gmail.com",
      "gmial.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "gemail.com": "gmail.com",
      "yaho.com": "yahoo.com",
      "hotmial.com": "hotmail.com",
    };

    if (commonTypos[domain]) {
      return res.status(400).json({
        error: `Aapne "@${domain}" enter kiya hai. Kya aapka email "@${commonTypos[domain]}" hai? Kripya sahi email likhein taaki OTP turant deliver ho sake.`,
      });
    }

    // 3. Strict Duplicate Check in Firebase Auth
    try {
      const existingUser = await admin.auth().getUserByEmail(cleanEmail);
      if (existingUser) {
        return res.status(400).json({
          error: "This email is already registered. Please login instead ❌",
        });
      }
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        console.error("Firebase auth check error:", err.message);
      }
    }

    // 4. Strict Duplicate Check in MongoDB Database
    const existingMongoUser = await User.findOne({ email: cleanEmail });
    if (existingMongoUser) {
      return res.status(400).json({
        error: "This email is already registered in our database. Please login instead ❌",
      });
    }

    // 5. Rate limiting: check cooldown (30 seconds)
    const existingOtpData = signupOtpStore[cleanEmail];
    if (existingOtpData && Date.now() - existingOtpData.lastSentAt < 30000) {
      const waitSeconds = Math.ceil(
        (30000 - (Date.now() - existingOtpData.lastSentAt)) / 1000,
      );
      return res.status(429).json({
        error: `Please wait ${waitSeconds}s before requesting a new code.`,
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in signupOtpStore (valid for 10 minutes, max 5 attempts)
    signupOtpStore[cleanEmail] = {
      otp,
      name: cleanName,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now(),
    };

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">StudyGroup Hub 🎓</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Email Verification Code</p>
        </div>
        <div style="padding: 32px 28px; color: #334155;">
          <p style="font-size: 16px; margin: 0 0 16px 0;">Hello <strong>${cleanName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #64748b;">
            Thank you for registering on StudyGroup Hub! To verify your email address and activate your account, please enter the one-time verification code (OTP) below:
          </p>
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #94a3b8; margin: 0 0 10px 0;">
            ⏳ <strong>Validity:</strong> This code is valid for <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 13px; color: #e11d48; margin: 0 0 24px 0;">
            ⚠️ <strong>Security:</strong> Never share this verification code with anyone.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Send mail using persistent fast transporter pool
      await fastMailTransporter.sendMail({
        from: `"StudyGroup Hub" <${process.env.EMAIL}>`,
        to: cleanEmail,
        subject: `🔐 ${otp} is your StudyGroup Hub verification code`,
        html: htmlContent,
        priority: "high",
      });

      console.log(`⚡ [INSTANT EMAIL SENT] to ${cleanEmail} (OTP: ${otp})`);
      return res.json({
        success: true,
        message: "Verification code sent to your email! Please check inbox/spam ✅",
      });
    } catch (mailErr) {
      console.error("❌ Nodemailer SMTP Error:", mailErr.message);
      console.log(`🔑 [OTP GENERATED] For ${cleanEmail}: ${otp}`);

      if (mailErr.code === "EAUTH") {
        return res.status(500).json({
          error: "Gmail SMTP Authentication Failed! Please check EMAIL_PASS in backend .env.",
        });
      }

      return res.status(500).json({
        error: "Failed to send email. Please check your email address and try again.",
      });
    }
  } catch (err) {
    console.error("sendSignupOTP error:", err);
    res.status(500).json({ error: err.message || "Failed to initiate verification." });
  }
};

// ➤ VERIFY SIGNUP OTP & CREATE ACCOUNT IN MONGODB & FIREBASE AUTH
const verifySignupOTP = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Missing required fields (email, password, OTP) ❌" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "").trim() || "Student";
    const userOtp = otp.toString().trim();

    const record = signupOtpStore[cleanEmail];

    if (!record) {
      return res.status(400).json({
        error: "No pending verification found for this email. Please request a new OTP ❌",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete signupOtpStore[cleanEmail];
      return res.status(400).json({
        error: "OTP has expired. Please request a new code ❌",
      });
    }

    if (record.attempts >= 5) {
      delete signupOtpStore[cleanEmail];
      return res.status(400).json({
        error: "Too many failed attempts. Please request a new OTP ❌",
      });
    }

    if (record.otp !== userOtp) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        error: `Invalid OTP ❌ (${remaining} attempts remaining)`,
      });
    }

    // OTP is valid - remove from store immediately
    delete signupOtpStore[cleanEmail];

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password: password,
        displayName: cleanName,
        emailVerified: true,
      });
    } catch (authErr) {
      if (authErr.code === "auth/email-already-exists") {
        return res.status(400).json({ error: "Account already exists with this email! Please login." });
      }
      throw authErr;
    }

    // Store user document in MongoDB
    await User.create({
      uid: userRecord.uid,
      name: cleanName,
      email: cleanEmail,
      role: "user",
      authProvider: "email",
      isEmailVerified: true,
    });

    // Create custom token so user can be automatically signed in on frontend
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      success: true,
      message: "Account verified and created successfully in MongoDB! 🎉",
      uid: userRecord.uid,
      customToken,
    });
  } catch (err) {
    console.error("verifySignupOTP error:", err);
    res.status(500).json({ error: err.message || "Failed to complete account registration." });
  }
};

// ================= PASSWORD RESET OTP SYSTEM =================

// ➤ SEND PASSWORD RESET OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const cleanEmail = email.trim().toLowerCase();

    // 🛑 CHECK IF USER IS REGISTERED
    try {
      await admin.auth().getUserByEmail(cleanEmail);
    } catch (error) {
      return res
        .status(404)
        .json({ error: "User not found. Please enter a registered email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[cleanEmail] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"StudyGroup Hub" <${process.env.EMAIL}>`,
      to: cleanEmail,
      subject: `🔐 ${otp} is your StudyGroup Hub password reset code`,
      text: `Hello,\n\nYour password reset verification code is:\n\n👉 ${otp}\n\nThis code is valid for 10 minutes.\n\nBest regards,\nStudyGroup Hub Team`,
    });

    res.json({ message: "OTP sent successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ VERIFY PASSWORD RESET OTP
const verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });
  const cleanEmail = email.trim().toLowerCase();

  const stored = otpStore[cleanEmail];
  if (stored && stored.otp === otp.toString().trim()) {
    if (Date.now() > stored.expiresAt) {
      delete otpStore[cleanEmail];
      return res.status(400).json({ message: "OTP expired ❌" });
    }
    delete otpStore[cleanEmail];
    res.json({ success: true, message: "OTP verified ✅" });
  } else {
    res.status(400).json({ message: "Invalid OTP ❌" });
  }
};

// 🔥 RESET PASSWORD AFTER OTP
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const user = await admin.auth().getUserByEmail(cleanEmail);

    await admin.auth().updateUser(user.uid, {
      password: password,
    });

    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ SYNC GOOGLE / THIRD PARTY USER WITH MONGODB
const syncUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL, authProvider } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "UID and Email required" });
    }

    const cleanEmail = email.toLowerCase();
    let user = await User.findOne({
      $or: [{ uid }, { email: cleanEmail }],
    });

    if (!user) {
      user = await User.create({
        uid,
        name: name || "Student",
        email: cleanEmail,
        photoURL: photoURL || "",
        role: "user",
        authProvider: authProvider || "google",
        isEmailVerified: true,
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      if (name) user.name = name;
      if (photoURL) user.photoURL = photoURL;
      if (!user.uid) user.uid = uid;
      await user.save();
    }

    res.json({ success: true, message: "User synced in MongoDB ✅", user });
  } catch (err) {
    console.error("syncUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
};
