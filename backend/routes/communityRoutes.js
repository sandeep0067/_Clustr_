const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

router.post('/create', communityController.createCommunity);
router.get('/', communityController.getCommunities);

module.exports = router;
