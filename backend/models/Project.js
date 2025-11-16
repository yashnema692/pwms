import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    client: { type: String, required: true },
    budget: { type: Number, required: true },
    status: { type: String, enum: ['LEAD', 'IN_PROGRESS', 'ON_HOLD', 'DONE'], default: 'LEAD' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: false }, // Added this field
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;