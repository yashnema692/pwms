import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    diff: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: 'at' } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
