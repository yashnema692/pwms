import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getSocketId, io } from '../socket/socket.js';

// @desc    Send a message (Text + File)
// @route   POST /api/messages/:receiverId
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        // 1. Handle File Upload (if a file was sent)
        let fileUrl = "";
        let fileType = "";
        
        if (req.file) {
            // Assuming you are serving static files from 'uploads' folder
            fileUrl = `/uploads/${req.file.filename}`; 
            
            // simple check: image vs other
            const mime = req.file.mimetype.split('/')[0];
            fileType = mime === 'image' || mime === 'video' ? mime : 'file'; 
        }

        // 2. Find or Create Conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // 3. Determine Initial Status
        const receiverSocketId = getSocketId(receiverId);
        // If receiver is online, we mark as 'delivered' immediately, otherwise 'sent'
        const initialStatus = receiverSocketId ? 'delivered' : 'sent';

        // 4. Create Message
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content: content || "", 
            fileUrl,
            fileType,
            status: initialStatus
        });

        await newMessage.save();
        await newMessage.populate('sender', 'email');

        // 5. Real-time Socket Emits
        if (receiverSocketId) {
            // Send the actual message payload to the chat window
            io.to(receiverSocketId).emit('newMessage', newMessage);
            
            // Send a notification (for toast or navbar badge)
            io.to(receiverSocketId).emit('messageNotification', {
                from: senderId,
                fromEmail: newMessage.sender.email,
                content: content || (fileType === 'image' ? 'Sent an image' : 'Sent a file'),
            });
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage:", error);
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

// @desc    Update message status (e.g., mark as 'seen')
// @route   PUT /api/messages/status
// @access  Private
export const updateMessageStatus = async (req, res) => {
    try {
        const { conversationId, status } = req.body; // status should be 'seen'
        const userId = req.user._id;

        if (!conversationId || !status) {
            return res.status(400).json({ message: "Missing conversationId or status" });
        }

        // Update all messages in this conversation where:
        // 1. I am the receiver
        // 2. The status is NOT ALREADY the new status (to avoid redundant writes)
        await Message.updateMany(
            { 
                conversationId: conversationId, 
                receiver: userId, 
                status: { $ne: status } 
            },
            { $set: { status: status } }
        );

        // Notify the SENDER that I have seen their messages
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            const senderId = conversation.participants.find(
                (id) => id.toString() !== userId.toString()
            );

            if (senderId) {
                const senderSocketId = getSocketId(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messageStatusUpdate', {
                        conversationId,
                        status,
                        updatedBy: userId // Who read the message (me)
                    });
                }
            }
        }

        res.status(200).json({ message: 'Status updated' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating status' });
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
            status: { $ne: 'seen' } 
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get unread message counts, grouped by sender
// @route   GET /api/messages/unread/counts-by-sender
// @access  Private
export const getUnreadCountsBySender = async (req, res) => {
    try {
        const receiverId = req.user._id;
        
        const counts = await Message.aggregate([
            { 
                $match: { 
                    receiver: receiverId, 
                    status: { $ne: 'seen' } 
                } 
            },
            { $group: { _id: "$sender", count: { $sum: 1 } } }
        ]);

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

// @desc    Clear chat history (Admin only)
// @route   DELETE /api/messages/clear/:conversationPartnerId
// @access  Private/Admin
export const clearChatHistory = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { conversationPartnerId } = req.params;

        const conversation = await Conversation.findOne({
            participants: { $all: [adminId, conversationPartnerId] }
        });

        if (!conversation) {
            return res.status(200).json({ message: 'No conversation found.' });
        }

        await Message.deleteMany({ conversationId: conversation._id });

        res.status(200).json({ message: 'Chat history cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: DELETE MESSAGE ---
// @desc    Soft delete a message (within 1 hour)
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // 1. Check Ownership
        if (message.sender.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 2. Check Time Limit (1 Hour = 3600000 ms)
        const timeDiff = Date.now() - new Date(message.createdAt).getTime();
        if (timeDiff > 3600000) { 
            return res.status(400).json({ message: 'You can only delete messages within 1 hour' });
        }

        // 3. Perform Soft Delete
        message.isDeleted = true;
        message.content = "This message was deleted"; 
        message.fileUrl = ""; // Remove attachment
        await message.save();

        // 4. Notify Receiver via Socket
        const receiverSocketId = getSocketId(message.receiver);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('messageDeleted', { messageId: id });
        }

        res.json({ message: 'Message deleted', messageId: id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: EDIT MESSAGE ---
// @desc    Edit a message (within 1 hour)
// @route   PUT /api/messages/:id
// @access  Private
export const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { newContent } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // 1. Check Ownership
        if (message.sender.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 2. Check Time Limit
        const timeDiff = Date.now() - new Date(message.createdAt).getTime();
        if (timeDiff > 3600000) {
            return res.status(400).json({ message: 'Edit time limit exceeded (1 hour)' });
        }

        // 3. Update Content
        message.content = newContent;
        message.isEdited = true;
        await message.save();

        // 4. Notify Receiver
        const receiverSocketId = getSocketId(message.receiver);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('messageEdited', { 
                messageId: id, 
                newContent: newContent 
            });
        }

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};