import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({}).populate('userId', 'email').populate('projectId', 'title').sort({ at: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
