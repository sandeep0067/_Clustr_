const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Number,
    default: Date.now,
  },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  participants: [{
    type: String,
    required: true,
  }],
  messages: [messageSchema],
  updatedAt: {
    type: Number,
    default: 0,
  },
  lastMessage: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
