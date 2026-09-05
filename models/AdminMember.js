const mongoose = require("mongoose");

const adminMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    job: { type: String, default: "Admin", trim: true },
    secretKey: { type: String, required: true, trim: true },
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
  mongoose.models.AdminMember ||
  mongoose.model("AdminMember", adminMemberSchema);
