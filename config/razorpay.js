const Razorpay = require("razorpay");

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log("ℹ️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env (Payment features will be disabled until configured).");
}

module.exports = razorpay;
