const SuperAdmin = require("../models/SuperAdmin");
const User = require("../models/User");
const AdminMember = require("../models/AdminMember");

const SUPER_ADMIN_EMAIL = "studygrouphubbteup1918@gmail.com";
const SUPER_ADMIN_PASS = "Studygroupbteup001";
const SUPER_ADMIN_NAME = "StudyGroupHub Super Admin";
const SUPER_ADMIN_ROLE = "Super Admin";

const initSuperAdmin = async () => {
  try {
    const cleanEmail = SUPER_ADMIN_EMAIL.toLowerCase().trim();

    // 1. Check or Upsert in SuperAdmin collection in MongoDB (internal collection only)
    let superAdmin = await SuperAdmin.findOneAndUpdate(
      { email: cleanEmail },
      {
        name: SUPER_ADMIN_NAME,
        email: cleanEmail,
        password: SUPER_ADMIN_PASS,
        role: SUPER_ADMIN_ROLE,
        secretKey: SUPER_ADMIN_PASS,
        isActive: true,
      },
      { upsert: true, returnDocument: "after" }
    );

    // 2. Ensure record exists in User collection
    await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        name: SUPER_ADMIN_NAME,
        email: cleanEmail,
        role: "admin",
        authProvider: "email",
        isEmailVerified: true,
        uid: superAdmin._id.toString(),
      },
      { upsert: true }
    );

    // 3. Remove Super Admin from AdminMember collection so it is NOT visible in dashboard list
    await AdminMember.deleteMany({ email: cleanEmail });

    console.log(`👑 [SUPER ADMIN INITIALIZED IN MONGODB] Email: ${cleanEmail} ✅ (Hidden from AdminMember UI)`);
  } catch (err) {
    console.error("⚠️ Failed to initialize Super Admin in MongoDB:", err.message);
  }
};

module.exports = initSuperAdmin;
