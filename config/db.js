const mongoose = require("mongoose");

const connectDB = async (retryCount = 0) => {
  try {
    let mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/studygrouphub";

    mongoUri = mongoUri.replace(/^["']|["']$/g, "").trim();

    if (
      mongoUri.startsWith("mongodb+srv://") &&
      !mongoUri.includes(".mongodb.net/")
    ) {
      mongoUri = mongoUri.replace(
        ".mongodb.net",
        ".mongodb.net/studygrouphub?retryWrites=true&w=majority",
      );
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("🍃 MongoDB Atlas Connected Successfully ✅");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    if (retryCount < 3) {
      console.log(`🔄 Retrying MongoDB connection (${retryCount + 1}/3)...`);
      setTimeout(() => connectDB(retryCount + 1), 3000);
    } else {
      console.warn(
        "⚠️ Please check your MONGO_URI in .env and MongoDB Atlas Network Access (IP Whitelist 0.0.0.0/0)",
      );
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🍃 MongoDB Reconnected Successfully ✅");
});

module.exports = connectDB;
