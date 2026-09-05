const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    session: {
      type: String,
      default: "2025-26",
      trim: true,
    },
    sno: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Syllabus", syllabusSchema);
