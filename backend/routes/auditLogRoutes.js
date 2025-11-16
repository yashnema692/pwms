import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
router.route('/').get(protect, admin, getAuditLogs);
export default router;
