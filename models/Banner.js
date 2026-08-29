const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: "" },
    category: { type: String, required: true, index: true },
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
  mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
