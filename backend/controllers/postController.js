const dualStorageService = require('../services/dualStorageService');
const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { userId, content, mediaUrl, skillTags } = req.body;

    const newPost = await dualStorageService.savePost({
      userId, content, mediaUrl, skillTags
    });

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error during post creation', error: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'name profilePic').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
