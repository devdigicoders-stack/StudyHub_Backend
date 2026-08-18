const db = require("../config/firebase");
const admin = require("firebase-admin");
const axios = require("axios");
const nodemailer = require("nodemailer");

// 👉 OTP TEMP STORAGE
let otpStore = {};

// ➤ TEST
const testUser = (req, res) => {
  res.send("Users route working ✅");
};

// ➤ ADD USER
const addUser = async (req, res) => {
  try {
    const doc = await db.collection("users").add(req.body);
    res.json({ id: doc.id, message: "User Added ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ GET USERS (Protected)
const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ UPDATE USER
const updateUser = async (req, res) => {
  try {
    await db.collection("users").doc(req.params.id).update(req.body);
    res.json({ message: "User Updated ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ DELETE USER
const deleteUser = async (req, res) => {
  try {
    await db.collection("users").doc(req.params.id).delete();
    res.json({ message: "User Deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ SIGNUP
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      uid: userRecord.uid,
      role: "user",
      createdAt: new Date(),
    });

    res.json({ message: "User Registered ✅", uid: userRecord.uid });
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

// ================= OTP SYSTEM =================

// ➤ SEND OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // 🛑 CHECK IF USER IS REGISTERED
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res
        .status(404)
        .json({ error: "User not found. Please enter a registered email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = otp;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "🔐 Verify Your Account - OTP Inside",
      text: `Hello,

Welcome to Study Group Hub! 🎓

To complete your verification, please use the following One-Time Password (OTP):

👉 ${otp}

⏳ This code is valid for 5 minutes only.

⚠️ For your security, never share this OTP with anyone.

If you didn’t request this, you can safely ignore this email.

Best regards,  
Team Study Group Hub 🚀`,
    });

    res.json({ message: "OTP sent successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ VERIFY OTP
const verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] == otp) {
    delete otpStore[email];
    res.json({ success: true, message: "OTP verified ✅" });
  } else {
    res.status(400).json({ message: "Invalid OTP ❌" });
  }
};

// 🔥 RESET PASSWORD AFTER OTP
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // get user by email
    const user = await admin.auth().getUserByEmail(email);

    // update password
    await admin.auth().updateUser(user.uid, {
      password: password,
    });

    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
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
};
