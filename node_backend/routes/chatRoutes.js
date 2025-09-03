// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

const {
    handleChatMessage,
    getChatHistory
} = require('../controllers/chatController');

// All chat routes are protected
router.use(protect);

router.post('/converse', handleChatMessage);
router.get('/history', getChatHistory);

module.exports = router;