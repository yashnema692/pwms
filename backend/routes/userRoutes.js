import express from 'express';
// --- THIS IS THE FIX ---
// We have removed 'getTotalUserCount' from the import list
import { 
    getAllUsers, 
    deleteUser, 
    updateUserRole, 
    getOnlineUserCount 
} from '../controllers/userController.js';
// -----------------------
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// This route allows all logged-in users to get the user list for chat
router.route('/')
    .get(protect, getAllUsers); 

// These routes remain admin-only
router.route('/online-count')
    .get(protect, admin, getOnlineUserCount);
    
router.route('/:id')
    .delete(protect, admin, deleteUser);

router.route('/:id/role')
    .put(protect, admin, updateUserRole);

export default router;