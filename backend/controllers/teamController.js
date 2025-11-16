import Team from '../models/Team.js';
import User from '../models/User.js';

// @desc    Create new team
// @route   POST /api/teams
// @access  Private/Admin
export const createTeam = async (req, res) => {
    const { name, members } = req.body;
    try {
        const team = new Team({
            name,
            members,
            createdBy: req.user._id,
        });
        const createdTeam = await team.save();
        res.status(201).json(createdTeam);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find({}).populate('members', 'email').populate('createdBy', 'email');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a team (members or name)
// @route   PUT /api/teams/:id
// @access  Private/Admin
export const updateTeam = async (req, res) => {
    const { name, members } = req.body;
    try {
        const team = await Team.findById(req.params.id);
        if (team) {
            team.name = name || team.name;
            team.members = members || team.members;
            const updatedTeam = await team.save();
            res.json(updatedTeam);
        } else {
            res.status(404).json({ message: 'Team not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Update failed' });
    }
};

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private/Admin
export const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (team) {
            // Add logic here to handle projects assigned to this team
            await team.deleteOne();
            res.json({ message: 'Team removed' });
        } else {
            res.status(404).json({ message: 'Team not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};