import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createNote, getNotes, deleteNote } from '../controllers/noteController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auto-create uploads folder logic (same as messageRoutes)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

router.route('/')
    .get(protect, getNotes)
    .post(protect, admin, upload.single('banner'), createNote);

router.route('/:id')
    .delete(protect, admin, deleteNote);

export default router;