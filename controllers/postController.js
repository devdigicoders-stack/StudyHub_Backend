const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  try {
    const { type, title, desc, link, author, tag } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Type and Title are required" });
    }

    const newPost = await Post.create({
      type,
      title,
      desc,
      link,
      author,
      tag,
    });

    res.status(201).json({
      success: true,
      id: newPost._id,
      ...newPost.toJSON(),
    });
  } catch (error) {
    console.error("Error creating post in MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts from MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.json({ success: true, message: "Post deleted successfully from MongoDB" });
  } catch (error) {
    console.error("Error deleting post from MongoDB:", error);
    res.status(500).json({ error: error.message });
  }
};
