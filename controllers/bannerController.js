const cloudinary = require("../config/cloudinary");
const { db } = require("../config/firebase");

// 🔥 UPLOAD
exports.uploadBanner = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${base64}`,
      {
        folder: `banners/${category}`,
      },
    );

    // 🔥 SAVE NEW
    const docRef = await db.collection("banners").add({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      category,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      data: {
        id: docRef.id,
        url: uploadResult.secure_url,
        category,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET BANNERS
exports.getBanners = async (req, res) => {
  try {
    const { category } = req.query;

    let query = db.collection("banners");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    if (snapshot.empty) return res.json([]);

    const banners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET SINGLE (if needed)
exports.getSingleBanner = async (req, res) => {
  try {
    const { page } = req.params;

    const snapshot = await db
      .collection("banners")
      .where("page", "==", page)
      .limit(1)
      .get();

    if (snapshot.empty) return res.json(null);

    const doc = snapshot.docs[0];

    return res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("banners").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Not found" });
    }

    const data = doc.data();

    if (data.public_id) {
      await cloudinary.uploader.destroy(data.public_id);
    }
    await docRef.delete();

    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
