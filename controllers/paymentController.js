const razorpay = require("../config/razorpay");

exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay is not configured on the server." });
    }
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
