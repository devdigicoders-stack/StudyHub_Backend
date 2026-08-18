const {db} = require("../config/firebase");

exports.createPost = async (req, res) => {
  try {
    const { type, title, desc, link, author, tag } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Type and Title are required" });
    }

    const dataToSave = {
      type,
      title,
      createdAt: new Date(),
    };

    if (desc) dataToSave.desc = desc;
    if (link) dataToSave.link = link;
    if (author) dataToSave.author = author;
    if (tag) dataToSave.tag = tag;

    const docRef = await db.collection("posts").add(dataToSave);
    res.status(201).json({ success: true, id: docRef.id, ...dataToSave });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const snapshot = await db.collection("posts").get();
    let posts = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    // Sort newest first
    posts.sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt)
        : new Date(0);
      const dateB = b.createdAt
        ? b.createdAt.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt)
        : new Date(0);
      return dateB - dateA;
    });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("posts").doc(id).delete();
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: error.message });
  }
};
