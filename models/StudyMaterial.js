const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    semester: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "book",
        "notes",
        "question_bank",
        "previous_paper",
        "important_question",
      ],
      default: "notes",
    },
    fileUrl: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
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
  mongoose.models.StudyMaterial ||
  mongoose.model("StudyMaterial", studyMaterialSchema);
