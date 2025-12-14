import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    sendMessage, 
    getMessages,
    getUnreadCount,
    getUnreadCountsBySender,
    updateMessageStatus,
    clearChatHistory,
    deleteMessage, // <--- 1. Import deleteMessage
    editMessage    // <--- 2. Import editMessage
} from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- AUTO-CREATE UPLOADS FOLDER ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// --- ROUTES ---

// Specific routes must come BEFORE the generic /:id route
router.route('/unread/counts-by-sender').get(protect, getUnreadCountsBySender);
router.route('/unread/count').get(protect, getUnreadCount);
router.route('/status').put(protect, updateMessageStatus); 
router.route('/clear/:conversationPartnerId').delete(protect, admin, clearChatHistory);

// Route for Sending (POST) and Retrieving (GET) messages
// This uses :receiverId because the controller expects req.params.receiverId
router.route('/:receiverId')
    .post(protect, upload.single('file'), sendMessage)
    .get(protect, getMessages);

// Route for Editing (PUT) and Deleting (DELETE) specific messages
// This uses :id because the controller expects req.params.id (the message ID)
// Note: Express will fall through to this route if the method is PUT or DELETE
router.route('/:id')
    .put(protect, editMessage)
    .delete(protect, deleteMessage);

export default router;