const cloudinary = require("../config/cloudinary");
const { db } = require("../config/firebase");

// 🔥 UPLOAD / UPDATE
exports.uploadBanner = async (req, res) => {
  try {
    const { page } = req.body;

    if (!page) {
      return res.status(400).json({ message: "Page is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `single_banners/${page}`,
    });

    // 🔥 old banner delete (same page) from 'single_banners' collection
    const snapshot = await db
      .collection("single_banners")
      .where("page", "==", page)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Only attempt to destroy if public_id exists
      if (data.public_id) {
        try {
          await cloudinary.uploader.destroy(data.public_id);
        } catch (e) {
          console.warn("Could not delete old image from Cloudinary:", e);
        }
      }
      await doc.ref.delete();
    }

    // 🔥 save new banner
    const docRef = await db.collection("single_banners").add({
      url: result.secure_url,
      public_id: result.public_id,
      page,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `${page} banner uploaded successfully`,
      data: {
        id: docRef.id,
        url: result.secure_url,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET BANNER
exports.getBanner = async (req, res) => {
  try {
    const { page } = req.params;

    const snapshot = await db
      .collection("single_banners")
      .where("page", "==", page)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json(null);
    }

    const doc = snapshot.docs[0];

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE BANNER
exports.deleteBanner = async (req, res) => {
  try {
    const { page } = req.params;

    // We used page string as param in UI earlier. Wait, let's check UI.
    // In AboutUpload: handle delete calls axios.delete(`${API}/${page}`);
    // So the param is actually :page, NOT id!

    const snapshot = await db
      .collection("single_banners")
      .where("page", "==", page)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Banner not found" });
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.public_id) {
        await cloudinary.uploader.destroy(data.public_id);
      }
      await doc.ref.delete();
    }

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
