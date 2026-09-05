const mongoose = require("mongoose");

const cardItemSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true, index: true },
    imageUrl: { type: String, default: "" },
    cloudinaryId: { type: String, default: "" },
    title: { type: String },
    name: { type: String },
    role: { type: String },
    branch: { type: String },
    companyName: { type: String },
    description: { type: String },
    projectName: { type: String },
    languageName: { type: String },
    link: { type: String },
    applyLink: { type: String },
    location: { type: String },
    salary: { type: String },
    github: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.jobId = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports =
  mongoose.models.CardItem || mongoose.model("CardItem", cardItemSchema);
