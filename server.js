require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// 🍃 CONNECT TO MONGODB
connectDB();

const initSuperAdmin = require("./utils/initSuperAdmin");
// Initialize Super Admin in MongoDB once DB connection is established
const mongoose = require("mongoose");
mongoose.connection.once("open", () => {
  initSuperAdmin();
});
setTimeout(() => initSuperAdmin(), 2000);

const app = express();

// ✅ MIDDLEWARE & BULLETPROOF CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Reflect requesting origin to allow credentials
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 ROUTES IMPORT
const paymentRoutes = require("./routes/paymentRoutes");
const bteupRoutes = require("./routes/bteupRoutes");


// Study Branch Routes
const firstyearRoutes = require("./routes/study/firstyearRoutes");
const cseRoutes = require("./routes/study/cseRoutes");
const itRoutes = require("./routes/study/itRoutes");
const mechanicalRoutes = require("./routes/study/mechanicalRoutes");
const civilRoutes = require("./routes/study/civilRoutes");
const electronicsRoutes = require("./routes/study/electronicsRoutes");
const electricalRoutes = require("./routes/study/electricalRoutes");
const studyRoutes = require("./routes/studyRoutes");

// Promotion Routes
const pramotionRoute = require("./routes/Pramotion");

// Upload Routes
const uploadRoute = require("./routes/upload");
const jobUploadRoute = require("./routes/jobUpload");
const ambassadorUploadRoute = require("./routes/ambassadorUpload");
const placedStudentRoutes = require("./routes/placedStudentRoutes");

// Team & User Routes
const adminTeamUploadRoute = require("./routes/adminTeamUpload");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// General Routes
const feedbackRoute = require("./routes/feedback");
const postRoute = require("./routes/postRoute");
const blogRoutes = require("./routes/blogRoutes");
const syllabusRoutes = require("./routes/syllabusRoutes");
const projectRequestRoute = require("./routes/projectRequest");
const contactRoute = require("./controllers/ContactDeatils");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminMemberRoutes = require("./routes/adminMemberRoutes");

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
safeUse("/api/firstyear", firstyearRoutes);
safeUse("/api/cse", cseRoutes);
safeUse("/api/it", itRoutes);
safeUse("/api/mechanical", mechanicalRoutes);
safeUse("/api/civil", civilRoutes);
safeUse("/api/electronics", electronicsRoutes);
safeUse("/api/electrical", electricalRoutes);
safeUse("/api/study", studyRoutes);
safeUse("/api/syllabus", syllabusRoutes);


// 📌 2. PAYMENT & PROMOTION
safeUse("/api/payment", paymentRoutes);
safeUse("/api/pramotion", pramotionRoute);

// 📌 3. UPLOADS & TEAMS
safeUse("/upload", uploadRoute);
safeUse("/uploadjob", jobUploadRoute);
safeUse("/api/blogs", blogRoutes);
safeUse("/uploadblog", blogRoutes);
safeUse("/upload-ambassador", ambassadorUploadRoute);
safeUse("/api/placed-students", placedStudentRoutes);
safeUse("/upload-placed-student", placedStudentRoutes);
safeUse("/api/admin-team", adminTeamUploadRoute);
safeUse("/api/admin-members", adminMemberRoutes);
safeUse("/api/admin", adminRoutes);

// 📌 4. USER & ENGAGEMENT ROUTES
safeUse("/api/users", userRoutes);
safeUse("/api/feedback", feedbackRoute);
safeUse("/api/posts", postRoute);
safeUse("/api/project-requests", projectRequestRoute);
safeUse("/api/contact", contactRoute);
safeUse("/api/analytics", analyticsRoutes);

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
  "/get-blogs",
  cardController.createGetHandler({
    collectionName: "blogs",
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

app.get(
  "/get-placed-students",
  cardController.createGetHandler({
    collectionName: "placed_students",
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
