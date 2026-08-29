const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String },
    link: { type: String },
    author: { type: String },
    tag: { type: String },
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

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
