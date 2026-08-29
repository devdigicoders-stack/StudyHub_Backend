const mongoose = require("mongoose");

const singleBannerSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    public_id: { type: String, default: "" },
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
  mongoose.models.SingleBanner ||
  mongoose.model("SingleBanner", singleBannerSchema);
