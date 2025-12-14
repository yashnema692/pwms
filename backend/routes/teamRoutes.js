import express from 'express';
import { 
    createTeam, 
    getAllTeams, 
    updateTeam, 
    deleteTeam,
    getTeamById // <--- 1. IMPORT THIS
} from '../controllers/teamController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createTeam)
    .get(protect, getAllTeams);

router.route('/:id')
    .get(protect, getTeamById) // <--- 2. ADD THIS LINE (Fixes the error)
    .put(protect, admin, updateTeam)
    .delete(protect, admin, deleteTeam);

export default router;