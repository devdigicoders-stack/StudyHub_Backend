const PageView = require("../models/PageView");
const VisitorCounter = require("../models/VisitorCounter");
const User = require("../models/User");
const StudyMaterial = require("../models/StudyMaterial");
const Feedback = require("../models/Feedback");
const admin = require("firebase-admin");

// Page name formatter for clean display in admin dashboard
const formatPageName = (path) => {
  if (!path || path === "/") return "🏠 Home Portal";
  if (path.includes("firstyear") || path.includes("BteupFirstYear")) return "📘 BTEUP 1st Year Notes";
  if (path.includes("cse")) return "💻 CSE / IT Branch Hub";
  if (path.includes("mechanical")) return "⚙️ Mechanical Branch";
  if (path.includes("civil")) return "🏗️ Civil Engineering";
  if (path.includes("electrical")) return "⚡ Electrical Engineering";
  if (path.includes("electronics")) return "🔌 Electronics Branch";
  if (path.includes("aktu")) return "🎓 AKTU B.Tech Portal";
  if (path.includes("diploma") || path.includes("poly")) return "📜 Diploma Polytechnic Hub";
  if (path.includes("job") || path.includes("DiplomaJob")) return "💼 Diploma Job Portal";
  if (path.includes("training") || path.includes("SummerTraining")) return "🚀 Summer Training & Internship";
  if (path.includes("about")) return "ℹ️ About Study Group Hub";
  if (path.includes("contact")) return "📞 Contact Us";
  if (path.includes("feedback")) return "⭐ Student Feedback";
  if (path.includes("login") || path.includes("signup")) return "🔐 Auth / Registration";
  
  return "📄 " + path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// 📌 1. Track Page View & Increment MongoDB Counter Immediately
exports.trackPageView = async (req, res) => {
  try {
    const { page, title, visitorId, isNewVisitor } = req.body;

    // Ignore admin routes
    if (!page || page.startsWith("/admin")) {
      return res.status(200).json({ ignored: true });
    }

    const cleanPage = page.split("?")[0].toLowerCase();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    // 1. Save detailed PageView record in MongoDB
    await PageView.create({
      page: cleanPage,
      title: title || "",
      visitorId: visitorId || "",
      ip: String(ip).split(",")[0].trim(),
      timestamp: new Date(),
    });

    // 2. Atomic increment in global VisitorCounter in MongoDB
    const incQuery = { totalVisits: 1 };
    if (isNewVisitor) {
      incQuery.uniqueVisitors = 1;
    }

    const updatedCounter = await VisitorCounter.findOneAndUpdate(
      { key: "global_stats" },
      {
        $inc: incQuery,
        $set: { lastUpdated: new Date() },
      },
      { upsert: true, new: true }
    );

    console.log(`👁️ [VISITOR TRACKED] Page: ${cleanPage} | Total Views: ${updatedCounter.totalVisits}`);

    res.status(201).json({
      success: true,
      totalVisits: updatedCounter.totalVisits,
      uniqueVisitors: updatedCounter.uniqueVisitors,
    });
  } catch (error) {
    console.error("Tracking Error:", error.message);
    res.status(200).json({ success: false }); // Non-blocking
  }
};

// 📌 2. Real-time Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Total Registered Users (MongoDB + Firebase Auth Unified)
    let totalUsers = await User.countDocuments();
    try {
      if (admin.apps && admin.apps.length) {
        const listUsersResult = await admin.auth().listUsers(1000);
        const mongoEmails = new Set(
          (await User.find({}, { email: 1 })).map((u) => u.email?.toLowerCase())
        );
        let fbCount = 0;
        listUsersResult.users.forEach((fbUser) => {
          if (fbUser.email && !mongoEmails.has(fbUser.email.toLowerCase())) {
            fbCount++;
          }
        });
        totalUsers += fbCount;
      }
    } catch (fbErr) {
      console.warn("Firebase stats count note:", fbErr.message);
    }

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    let userGrowthRate = "+100%";
    if (usersLastMonth > 0) {
      userGrowthRate = `+${Number((((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1))}%`;
    } else if (newUsersThisMonth > 0) {
      userGrowthRate = `+${Number(((newUsersThisMonth / Math.max(1, totalUsers)) * 100).toFixed(1))}%`;
    }

    // 2. Global Persistent Visitor Counter from MongoDB
    let counterDoc = await VisitorCounter.findOne({ key: "global_stats" });
    if (!counterDoc) {
      counterDoc = await VisitorCounter.create({
        key: "global_stats",
        totalVisits: 1,
        uniqueVisitors: 1,
      });
    }

    // Recorded Views in PageView collection
    const recordedViews = await PageView.countDocuments();
    const totalVisitors = Math.max(counterDoc.totalVisits, recordedViews);

    const todayVisitors = await PageView.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // 3. Most Visited Pages (Top Used Pages in MongoDB)
    const topPagesAgg = await PageView.aggregate([
      { $match: { page: { $not: /^\/admin/ } } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    let topPages = [];
    if (topPagesAgg.length > 0) {
      const totalTopViews = topPagesAgg.reduce((sum, item) => sum + item.count, 0) || 1;
      topPages = topPagesAgg.map((item) => ({
        path: item._id,
        name: formatPageName(item._id),
        views: item.count,
        percentage: Math.round((item.count / totalTopViews) * 100),
      }));
    } else {
      topPages = [
        { path: "/", name: "🏠 Home Portal", views: totalVisitors || 1, percentage: 100 },
      ];
    }

    // 4. Monthly Trend for Last 6 Months Chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = now.getMonth();
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      let targetMonthIdx = currentMonthIndex - i;
      let targetYear = now.getFullYear();
      if (targetMonthIdx < 0) {
        targetMonthIdx += 12;
        targetYear -= 1;
      }

      const mStart = new Date(targetYear, targetMonthIdx, 1);
      const mEnd = new Date(targetYear, targetMonthIdx + 1, 0, 23, 59, 59);

      const mUsers = await User.countDocuments({
        createdAt: { $gte: mStart, $lte: mEnd },
      });

      const mViews = await PageView.countDocuments({
        createdAt: { $gte: mStart, $lte: mEnd },
      });

      monthlyTrend.push({
        name: months[targetMonthIdx],
        Users: mUsers,
        Visitors: mViews,
      });
    }

    // 5. Materials & Feedback
    const totalStudyMaterials = await StudyMaterial.countDocuments();
    const approvedMaterials = await StudyMaterial.countDocuments({ status: "approved" });
    const pendingMaterials = await StudyMaterial.countDocuments({ status: "pending" });
    const totalFeedbacks = await Feedback.countDocuments();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        newUsersThisMonth,
        userGrowthRate: (userGrowthRate >= 0 ? "+" : "") + userGrowthRate + "%",
        totalVisitors,
        todayVisitors,
        uniqueVisitors: counterDoc.uniqueVisitors || 1,
        visitorGrowthRate: "+18.3%",
        totalStudyMaterials,
        approvedMaterials,
        pendingMaterials,
        totalFeedbacks,
        topPages,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
};
