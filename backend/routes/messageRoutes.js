import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // <--- 1. IMPORT FS
import { 
    sendMessage, 
    getMessages,
    getUnreadCount,
    getUnreadCountsBySender,
    updateMessageStatus,
    clearChatHistory
} from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- 2. AUTO-CREATE UPLOADS FOLDER ---
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

router.route('/unread/counts-by-sender').get(protect, getUnreadCountsBySender);
router.route('/unread/count').get(protect, getUnreadCount);
router.route('/status').put(protect, updateMessageStatus); 
router.route('/clear/:conversationPartnerId').delete(protect, admin, clearChatHistory);

router.route('/:receiverId')
    .post(protect, upload.single('file'), sendMessage)
    .get(protect, getMessages);

export default router;