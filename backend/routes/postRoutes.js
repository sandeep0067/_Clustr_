const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/create', postController.createPost);
router.get('/feed', postController.getFeed);

module.exports = router;
