const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Anonymous Scholar" },
    category: { type: String, default: "Overall Experience" },
    rating: { type: Number, required: true },
    comment: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
