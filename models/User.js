const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, index: true },
    name: { type: String, default: "Student", trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: "", trim: true },
    college: { type: String, default: "", trim: true },
    branch: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    photoURL: { type: String, default: "" },
    role: { type: String, default: "user" },
    authProvider: { type: String, default: "email" },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.uid;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
