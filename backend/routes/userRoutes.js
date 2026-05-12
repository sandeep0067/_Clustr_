const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.get('/:id', userController.getUserProfile);
router.patch('/:id', userController.updateUserProfile);
router.post('/:uid/follow/:targetUid', userController.toggleFollow);

module.exports = router;
