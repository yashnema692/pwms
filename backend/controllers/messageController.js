import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getSocketId, io } from '../socket/socket.js';

// @desc    Send a message
// @route   POST /api/messages/:receiverId
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            isRead: false, // <-- Set as unread by default
        });

        await newMessage.save();
        await newMessage.populate('sender', 'email');

        // Socket.io real-time event for the chat window
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
            
            // NEW: Emit a separate notification event for the navbar
            io.to(receiverSocketId).emit('messageNotification', {
                from: senderId,
                fromEmail: newMessage.sender.email,
                content: newMessage.content,
            });
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages between two users
// @route   GET /api/messages/:receiverId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            return res.json([]);
        }

        const messages = await Message.find({
            conversationId: conversation._id,
        }).populate('sender', 'email').sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get total unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Message.countDocuments({
            receiver: userId,
            isRead: false,
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark messages from a sender as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
export const markMessagesAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const receiverId = req.user._id;

        await Message.updateMany(
            { sender: senderId, receiver: receiverId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- ADD THIS NEW FUNCTION ---
// @desc    Get unread message counts, grouped by sender
// @route   GET /api/messages/unread/counts-by-sender
// @access  Private
export const getUnreadCountsBySender = async (req, res) => {
    try {
        const receiverId = req.user._id;
        
        // Use aggregation to find unread messages and group them by sender
        const counts = await Message.aggregate([
            { $match: { receiver: receiverId, isRead: false } },
            { $group: { _id: "$sender", count: { $sum: 1 } } }
        ]);

        // Convert the result from [{ _id: 'senderId', count: 2 }]
        // to a more useful object: { 'senderId': 2 }
        const countsMap = counts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.json(countsMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- ADD THIS NEW FUNCTION ---

// @desc    Clear chat history (Admin only)
// @route   DELETE /api/messages/clear/:conversationPartnerId
// @access  Private/Admin
export const clearChatHistory = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { conversationPartnerId } = req.params;

        // Find the conversation
        const conversation = await Conversation.findOne({
            participants: { $all: [adminId, conversationPartnerId] }
        });

        if (!conversation) {
            // No chat to clear, but that's okay.
            return res.status(200).json({ message: 'No conversation found.' });
        }

        // Delete all messages associated with this conversation
        await Message.deleteMany({ conversationId: conversation._id });

        res.status(200).json({ message: 'Chat history cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};