const mongoose = require("mongoose");

const visitorCounterSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global_stats", unique: true, index: true },
    totalVisits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VisitorCounter ||
  mongoose.model("VisitorCounter", visitorCounterSchema);
