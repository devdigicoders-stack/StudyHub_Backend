// middleware/auth.js
const admin = require("firebase-admin");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized ❌" });
  }
};

module.exports = verifyToken;