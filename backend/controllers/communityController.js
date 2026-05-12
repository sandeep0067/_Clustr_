const Community = require('../models/Community');

exports.createCommunity = async (req, res) => {
  try {
    const { name, skillCategory, members } = req.body;

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
       return res.status(400).json({ message: 'Community name already exists' });
    }

    const community = new Community({ name, skillCategory, members });
    await community.save();

    res.status(201).json({ message: 'Community created', community });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate('members', 'name').sort({ createdAt: -1 });
    res.json(communities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
