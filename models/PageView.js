const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    visitorId: { type: String, index: true },
    ip: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PageView || mongoose.model("PageView", pageViewSchema);
