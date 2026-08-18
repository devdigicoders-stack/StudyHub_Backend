require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/firebase");

const app = express();

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 ROUTES IMPORT
const paymentRoutes = require("./routes/paymentRoutes");
const bteupRoutes = require("./routes/bteupRoutes");


// Study Branch Routes
const cseRoutes = require("./routes/study/cseRoutes");
const itRoutes = require("./routes/study/itRoutes");
const mechanicalRoutes = require("./routes/study/mechanicalRoutes");
const civilRoutes = require("./routes/study/civilRoutes");
const electronicsRoutes = require("./routes/study/electronicsRoutes");
const electricalRoutes = require("./routes/study/electricalRoutes");
const studyRoutes = require("./routes/studyRoutes");

// Banner & Promotion Routes
const bannerRoutes = require("./routes/bannerRoutes");
const singlebannerRoutes = require("./routes/singlebannerRoutes");
const pramotionRoute = require("./routes/Pramotion");

// Upload Routes
const uploadRoute = require("./routes/upload");
const jobUploadRoute = require("./routes/jobUpload");
const ambassadorUploadRoute = require("./routes/ambassadorUpload");

// Team & User Routes
const devTeamUploadRoute = require("./routes/devTeamUpload");
const coreTeamUploadRoute = require("./routes/coreTeamUpload");
const adminTeamUploadRoute = require("./routes/adminTeamUpload");
const userRoutes = require("./routes/userRoutes");

// General Routes
const feedbackRoute = require("./routes/feedback");
const postRoute = require("./routes/postRoute");
const projectRequestRoute = require("./routes/projectRequest");
const contactRoute = require("./controllers/ContactDeatils");

// Controllers
const cardController = require("./controllers/cardController");

// 🔥 SAFE ROUTE USE FUNCTION
const safeUse = (path, route) => {
  if (typeof route === "function" || (route && typeof route === "object")) {
    app.use(path, route);
    console.log(`✅ Loaded: ${path}`);
  } else {
    console.log(`❌ ERROR in route: ${path} (Module improperly exported)`);
  }
};

// 📌 1. STUDY & BRANCH ROUTES
safeUse("/api/cse", cseRoutes);
safeUse("/api/it", itRoutes);
safeUse("/api/mechanical", mechanicalRoutes);
safeUse("/api/civil", civilRoutes);
safeUse("/api/electronics", electronicsRoutes);
safeUse("/api/electrical", electricalRoutes);
safeUse("/api/study", studyRoutes);

// 📌 2. BANNERS, PAYMENT & PROMOTION
safeUse("/api/banner", bannerRoutes);
safeUse("/api/single-banner", singlebannerRoutes);
safeUse("/api/payment", paymentRoutes);
safeUse("/api/pramotion", pramotionRoute);

// 📌 3. UPLOADS & TEAMS
safeUse("/upload", uploadRoute);
safeUse("/uploadjob", jobUploadRoute);
safeUse("/upload-ambassador", ambassadorUploadRoute);
safeUse("/api/dev-team", devTeamUploadRoute);
safeUse("/api/core-team", coreTeamUploadRoute);
safeUse("/api/admin-team", adminTeamUploadRoute);

// 📌 4. USER & ENGAGEMENT ROUTES
safeUse("/api/users", userRoutes);
safeUse("/api/feedback", feedbackRoute);
safeUse("/api/posts", postRoute);
safeUse("/api/project-requests", projectRequestRoute); // Fixed: safeUse se wrap kiya
safeUse("/api/contact", contactRoute);

// 📌 5. BTEUP ROUTES
safeUse("/api/bteup", bteupRoutes);


// 📌 6. CARD CONTROLLER HANDLERS
app.get(
  "/get-jobs",
  cardController.createGetHandler({
    collectionName: "jobs",
    sortOrder: "desc",
  }),
);

app.get(
  "/get-ambassadors",
  cardController.createGetHandler({
    collectionName: "ambassadors",
    sortOrder: "desc",
  }),
);

// ✅ HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🚀 API Running Successfully");
});

// ❌ 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Not Found",
  });
});

// ❌ GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    message: "Something went wrong",
    error: err.message,
  });
});

// ✅ SERVER START
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
