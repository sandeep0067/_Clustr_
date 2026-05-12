import fs from 'fs';
import path from 'path';
import express from 'express';
import http from 'http';
import multer from 'multer';
import crypto from 'crypto';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { handleRegisterValidation, handleMessageValidation } from './src/validation/socketValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const Post = require('./backend/models/Post');
const User = require('./backend/models/User');
const Conversation = require('./backend/models/Conversation');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const prisma = new PrismaClient();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://Naman:2410990736@ac-ajfrbqf-shard-00-00.ut9zkta.mongodb.net:27017,ac-ajfrbqf-shard-00-01.ut9zkta.mongodb.net:27017,ac-ajfrbqf-shard-00-02.ut9zkta.mongodb.net:27017/clustrDB?ssl=true&replicaSet=atlas-hgb2d5-shard-0&authSource=admin&retryWrites=true&w=majority';
const MASKED_URI = MONGO_URI.replace(/:([^@]+)@/, ':****@');
console.log(`Attempting to connect to MongoDB: ${MASKED_URI}`);
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Waiting for auto-reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

try {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4,
  });
  console.log(`MongoDB connected successfully. State: ${mongoose.connection.readyState}, DB: ${mongoose.connection.db.databaseName}`);
} catch (error) {
  console.error('MongoDB connection failed. Exiting process.', error.message);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const uploadsDirectory = path.join(__dirname, 'uploads');
const mediaUploadLimitBytes = 25 * 1024 * 1024;
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
]);
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const postMediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadsDirectory);
    },
    filename: (_req, file, callback) => {
      const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeOriginalName}`);
    },
  }),
  limits: {
    fileSize: mediaUploadLimitBytes,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.mp4',
      '.webm',
      '.ogg',
      '.mov',
      '.m4v',
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.xls',
      '.xlsx',
      '.txt',
      '.zip',
      '.rar',
      '.u002e',
    ]);

    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('application/') ||
      file.mimetype.startsWith('text/') ||
      allowedExtensions.has(extension)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Only supported media and document files are allowed'));
  },
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDirectory));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    await prisma.newsletter.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return res.status(201).json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Newsletter subscribe failed:', error);
    return res.status(500).json({ success: false, message: 'Could not subscribe right now.' });
  }
});

const toPublicUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  const displayName = obj.displayName || obj.name || obj.email?.split('@')[0] || 'Member';
  return {
    id: obj.uid,
    uid: obj.uid,
    name: obj.name || displayName,
    displayName,
    email: obj.email || '',
    username: obj.username || `@${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || obj.uid.slice(0, 4)}`,
    photoURL: obj.photoURL || obj.profilePic || '',
    profilePic: obj.profilePic || obj.photoURL || '',
    skills: obj.skills || obj.skillsToTeach || [],
    savedPosts: obj.savedPosts || [],
    followers: obj.followers || [],
    following: obj.following || [],
    role: obj.role || '',
    bio: obj.bio || '',
    currentStory: obj.currentStory || '',
    currentStoryType: obj.currentStoryType || '',
    storyTimestamp: obj.storyTimestamp || 0,
    joinedAt: obj.joinedAt || (obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now()),
  };
};

const hashPassword = (password = '') =>
  crypto.createHash('sha256').update(`${process.env.AUTH_SECRET || 'clustr-local'}:${password}`).digest('hex');

const buildUsernameFromName = (name = '', uid = '') => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12);
  return `@${base || uid.slice(0, 4) || 'user'}`;
};

const generateToken = (user) => {
  return jwt.sign(
    { uid: user.uid, email: user.email, name: user.name || user.displayName },
    process.env.JWT_SECRET || 'clustr-local',
    { expiresIn: '7d' }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

const clearAuthCookie = (res) => {
  res.clearCookie('token', cookieOptions);
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clustr-local');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed', error: error.message });
  }
};

const protectSelf = async (req, res, next) => {
  await protect(req, res, () => {
    if (req.user && req.user.uid === req.params.uid) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: you can only modify your own account' });
  });
};

const handleSignup = async (req, res) => {
  try {
    const { name = '', email = '', password = '' } = req.body || {};
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Enter an email and a password with at least 6 characters.' });
    }

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'That email is already in use.' });
    }

    const uid = crypto.randomUUID();
    const user = await User.create({
      uid,
      name: trimmedName,
      displayName: trimmedName,
      email: trimmedEmail,
      password,
      username: buildUsernameFromName(trimmedName, uid),
      photoURL: '',
      savedPosts: [],
      followers: [],
      following: [],
      skills: [],
      joinedAt: Date.now(),
    });

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, user: toPublicUser(user), token });
  } catch (error) {
    console.error('Signup failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({ success: true, user: toPublicUser(user), token });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ success: false, message: 'Failed to log in' });
  }
};

app.post('/api/users/register', handleSignup);
app.post('/api/users/login', handleLogin);

app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});
app.post('/api/users/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(toPublicUser));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

app.patch('/api/users/:uid', protectSelf, async (req, res) => {
  try {
    const allowed = ['displayName', 'name', 'username', 'photoURL', 'profilePic', 'skills', 'savedPosts', 'followers', 'following', 'role', 'bio', 'currentStory', 'currentStoryType', 'storyTimestamp', 'joinedAt'];
    const updates = {};
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findOneAndUpdate({ uid: req.params.uid }, updates, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json(toPublicUser(user));
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

app.post('/api/users/:uid/follow/:targetUid', protectSelf, async (req, res) => {
  try {
    const { uid, targetUid } = req.params;
    if (uid === targetUid) return res.status(400).json({ success: false, message: 'Cannot follow yourself' });

    const currentUser = await User.findOne({ uid });
    const targetUser = await User.findOne({ uid: targetUid });
    if (!currentUser || !targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = (currentUser.following || []).includes(targetUid);
    await User.updateOne({ uid }, isFollowing ? { $pull: { following: targetUid } } : { $addToSet: { following: targetUid } });
    await User.updateOne({ uid: targetUid }, isFollowing ? { $pull: { followers: uid } } : { $addToSet: { followers: uid } });

    const users = await User.find({ uid: { $in: [uid, targetUid] } });
    res.json({ success: true, users: users.map(toPublicUser) });
  } catch (error) {
    console.error('Follow update failed:', error);
    res.status(500).json({ success: false, message: 'Failed to update follow state' });
  }
});

app.post('/api/users/:uid/saved-posts/:postId', protectSelf, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isSaved = (user.savedPosts || []).includes(req.params.postId);
    const updated = await User.findOneAndUpdate(
      { uid: req.params.uid },
      isSaved ? { $pull: { savedPosts: req.params.postId } } : { $addToSet: { savedPosts: req.params.postId } },
      { returnDocument: 'after' }
    );

    res.json(toPublicUser(updated));
  } catch (error) {
    console.error('Saved post update failed:', error);
    res.status(500).json({ success: false, message: 'Failed to update saved post' });
  }
});

app.post('/api/uploads/post-media', (req, res) => {
  postMediaUpload.single('media')(req, res, (error) => {
    if (error) {
      const isSizeError = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
      const uploadLimitMB = Math.round(mediaUploadLimitBytes / (1024 * 1024));
      res.status(400).json({
        success: false,
        message: isSizeError ? `File is too large. Max size is ${uploadLimitMB}MB.` : error.message,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No media file uploaded' });
      return;
    }

    const uploadedExtension = path.extname(req.file.originalname || '').toLowerCase();
    const mediaType = req.file.mimetype.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(uploadedExtension)
      ? 'video'
      : req.file.mimetype.startsWith('image/')
        ? 'image'
        : 'file';
    res.status(201).json({
      success: true,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      mediaType,
    });
  });
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

const userConnections = new Map();

app.get('/api/posts', async (_req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const formatted = posts.map(p => {
      const obj = p.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(formatted);
  } catch (error) {
    console.error('Failed to fetch posts from MongoDB:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', protect, async (req, res) => {
  try {
    const payload = req.body || {};
    
    if (!payload.authorId) {
      return res.status(400).json({ success: false, message: 'authorId is required' });
    }

    const newPost = new Post({
      authorId: payload.authorId,
      title: payload.title || '',
      content: payload.content || '',
      mediaUrl: payload.mediaUrl || payload.imageUrl || '',
      imageUrl: payload.imageUrl || '',
      mediaType: payload.mediaType || '',
      postType: payload.postType || 'standard',
      skillTags: Array.isArray(payload.skills) ? payload.skills : [],
      createdAt: payload.createdAt ? new Date(payload.createdAt) : Date.now()
    });

    await newPost.save();
    
    const savedPost = newPost.toObject();
    savedPost.id = savedPost._id.toString();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('MongoDB error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

app.patch('/api/posts/:id', protect, async (req, res) => {
  try {
    const updates = req.body;
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const obj = updatedPost.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('MongoDB error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

app.get('/api/conversations/:uid', async (req, res) => {
  try {
    const threads = await Conversation.find({ participants: req.params.uid }).sort({ updatedAt: -1 });
    res.json(threads.map((thread) => thread.toObject()));
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

app.put('/api/conversations/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    
    const thread = await Conversation.findOneAndUpdate(
      { id },
      {
        id,
        participants: payload.participants || [],
        messages: payload.messages || [],
        updatedAt: payload.updatedAt || Date.now(),
        lastMessage: payload.lastMessage || '',
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Conversation not found and could not be created' });
    }
    
    res.json(thread.toObject());
  } catch (error) {
    console.error(`[Conversation Error] Failed to save thread ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to save conversation', error: error.message });
  }
});

app.delete('/api/conversations/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Conversation.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error(`[Conversation Error] Failed to delete thread ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation', error: error.message });
  }
});

app.delete('/api/posts/:id', protect, async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('MongoDB error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

const getThreadId = (userA, userB) => [userA, userB].sort().join('__');

io.on('connection', (socket) => {
  console.log(`[Socket Connection] ${socket.id} connected`);

  socket.on('register', (data) => {
    const registrationData = handleRegisterValidation(socket, data);

    if (!registrationData) {
      return;
    }

    socket.data.userId = registrationData.userId;
    socket.data.following = registrationData.following;
    socket.data.followers = registrationData.followers;

    userConnections.set(registrationData.userId, {
      following: registrationData.following,
      followers: registrationData.followers,
    });

    socket.join(registrationData.userId);

    Conversation.find({ participants: registrationData.userId }).sort({ updatedAt: -1 })
      .then((threads) => {
        socket.emit('conversations:init', {
          success: true,
          message: 'Conversations initialized',
          threads: threads.map((thread) => thread.toObject()),
          count: threads.length,
        });
      })
      .catch((error) => console.error(`Conversation init failed: ${error.message}`));
  });

  socket.on('message:send', async (data) => {
    try {
      const message = handleMessageValidation(socket, data);

      if (!message) {
        return;
      }

      const threadId = getThreadId(message.from, message.to);
      const existingDoc = await Conversation.findOne({ id: threadId });
      const existing = existingDoc?.toObject() || {
        id: threadId,
        participants: [message.from, message.to],
        messages: [],
        updatedAt: 0,
        lastMessage: '',
      };

      const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        authorId: message.from,
        text: message.text,
        createdAt: Date.now(),
      };

      const updatedThread = {
        ...existing,
        messages: [...existing.messages, newMessage],
        updatedAt: newMessage.createdAt,
        lastMessage: newMessage.text,
      };

      await Conversation.findOneAndUpdate(
        { id: threadId },
        updatedThread,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      socket.emit('message:confirmation', {
        success: true,
        message: 'Message sent successfully',
        messageId: newMessage.id,
      });

      io.to(message.from).emit('conversation:update', updatedThread);
      io.to(message.to).emit('conversation:update', updatedThread);
    } catch (error) {
      console.error(`[Message Error] ${socket.id}: ${error.message}`);
      socket.emit('error:validation', {
        event: 'message:send',
        errors: ['Failed to save message'],
      });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    console.log(`[Socket Disconnected] ${socket.id}${userId ? ` (user: ${userId})` : ''}`);
  });

  socket.on('error', (error) => {
    console.error(`[Socket Error] ${socket.id}:`, error);
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    ok: true,
    server: 'Socket.IO Chat Server',
    status: 'running',
    postStorage: 'mongodb',
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);

function startServer(port) {
  server.listen(port, () => {
    console.log(`Socket server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
      server.removeAllListeners('error');
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
