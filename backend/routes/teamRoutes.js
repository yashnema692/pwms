import express from 'express';
import { createTeam, getAllTeams, updateTeam, deleteTeam } from '../controllers/teamController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createTeam)
    .get(protect, getAllTeams);

router.route('/:id')
    .put(protect, admin, updateTeam)
    .delete(protect, admin, deleteTeam);

export default router;