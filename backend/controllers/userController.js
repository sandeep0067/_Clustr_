const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { setCookie, clearCookie } = require('../cookies/cookieHelper');

const generateToken = (user) => {
  return jwt.sign(
    { uid: user.uid, email: user.email, name: user.name || user.displayName },
    process.env.JWT_SECRET || 'clustr-local',
    { expiresIn: '7d' }
  );
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, uid, skillsToLearn, skillsToTeach, bio } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = await User.create({
      uid: uid || `u-${Date.now()}`,
      name,
      displayName: name,
      email,
      password,
      skillsToLearn,
      skillsToTeach,
      bio
    });

    const token = generateToken(newUser);
    setCookie(res, 'token', token);
    res.status(201).json({ message: 'User registered successfully', user: newUser, token });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    setCookie(res, 'token', token);
    res.json({ message: 'Login successful', user, token });
  } catch (error) {
    next(error);
  }
};

exports.logoutUser = async (_req, res, next) => {
  try {
    clearCookie(res, 'token');
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ uid: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findOneAndUpdate({ uid: id }, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const { uid, targetUid } = req.params;

    const user = await User.findOne({ uid });
    const targetUser = await User.findOne({ uid: targetUid });

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = user.following.includes(targetUid);

    if (isFollowing) {
      user.following = user.following.filter(id => id !== targetUid);
      targetUser.followers = targetUser.followers.filter(id => id !== uid);
    } else {
      user.following.push(targetUid);
      targetUser.followers.push(uid);
    }

    await user.save();
    await targetUser.save();

    const allUsers = await User.find({});
    res.json({ message: isFollowing ? 'Unfollowed' : 'Followed', users: allUsers });
  } catch (error) {
    next(error);
  }
};
