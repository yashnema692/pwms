import express from 'express';
import { 
    sendMessage, 
    getMessages,
    getUnreadCount,
    markMessagesAsRead,
    getUnreadCountsBySender,
    clearChatHistory
} from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- THESE ROUTES ARE NOW OPEN TO ALL LOGGED-IN USERS ---
router.route('/unread/counts-by-sender').get(protect, getUnreadCountsBySender);
router.route('/unread/count').get(protect, getUnreadCount);
router.route('/read/:senderId').put(protect, markMessagesAsRead);

// --- THIS ROUTE REMAINS ADMIN-ONLY ---
router.route('/clear/:conversationPartnerId').delete(protect, admin, clearChatHistory);

// --- THESE ROUTES ARE NOW OPEN TO ALL LOGGED-IN USERS ---
router.route('/:receiverId')
    .post(protect, sendMessage)
    .get(protect, getMessages);

export default router;