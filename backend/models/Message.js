import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        default: "", // Can be empty if sending just a file
    },
    fileUrl: {
        type: String,
        default: "",
    },
    fileType: {
        type: String, // 'image', 'video', 'application'
        default: "",
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent',
    },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;