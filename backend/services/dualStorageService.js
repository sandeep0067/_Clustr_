const User = require('../models/User');
const Post = require('../models/Post');

const mongoStorageService = {
  async saveUser(userData) {
    try {
      const mongoUser = new User(userData);
      await mongoUser.save();
      return mongoUser;
    } catch (error) {
      console.error("Error in mongoStorageService.saveUser:", error);
      throw error;
    }
  },

  async savePost(postData) {
    try {
      const mongoPost = new Post(postData);
      await mongoPost.save();
      return mongoPost;
    } catch (error) {
      console.error("Error in mongoStorageService.savePost:", error);
      throw error;
    }
  }
};

module.exports = mongoStorageService;
