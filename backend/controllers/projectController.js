import Project from '../models/Project.js';
import AuditLog from '../models/AuditLog.js';

const createAuditLog = async (projectId, userId, action, diff = {}) => {
    await AuditLog.create({ projectId, userId, action, diff });
};

export const getProjects = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [{ title: searchRegex }, { client: searchRegex }];
    }

    try {
        const totalCount = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .populate('ownerId', 'email')
            .populate('assignedTeam', 'name') // Populate team name
            .sort({ updatedAt: -1 })
            .limit(limit)
            .skip(skip);
        res.json({ projects, page, totalPages: Math.ceil(totalCount / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createProject = async (req, res) => {
    // Include assignedTeam
    const { title, client, budget, status, assignedTeam } = req.body;
    try {
        const project = await Project.create({ 
            title, 
            client, 
            budget, 
            status, 
            ownerId: req.user._id,
            assignedTeam: assignedTeam || null // Handle optional team
        });
        await createAuditLog(project._id, req.user._id, 'CREATE', { newData: project });
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

export const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (req.user.role !== 'ADMIN' && project.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const oldData = { ...project.toObject() };
        
        // Update assignedTeam if provided
        if (req.body.assignedTeam) {
            project.assignedTeam = req.body.assignedTeam;
        } else if (req.body.assignedTeam === '') {
             project.assignedTeam = null; // Allow un-assigning
        }

        Object.assign(project, req.body);
        
        const updatedProject = await project.save();
        await createAuditLog(project._id, req.user._id, 'UPDATE', { oldData, newData: updatedProject });
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: 'Update failed' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project) {
            await createAuditLog(project._id, req.user._id, 'DELETE', { deletedData: project });
            await project.deleteOne();
            res.json({ message: 'Project deleted' });
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};