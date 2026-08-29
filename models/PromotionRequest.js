const mongoose = require("mongoose");

const promotionRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
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
  mongoose.models.PromotionRequest ||
  mongoose.model("PromotionRequest", promotionRequestSchema);
