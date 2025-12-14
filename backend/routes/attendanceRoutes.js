import express from 'express';
import { markAttendance, getMyAttendance, getAllAttendance } from '../controllers/attendanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/mark', protect, markAttendance);
router.get('/my-history', protect, getMyAttendance);
router.get('/all', protect, admin, getAllAttendance);

export default router;