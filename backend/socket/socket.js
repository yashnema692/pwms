import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import User from '../models/User.js';

const app = express();
const server = http.createServer(app);

// Map to store { userId: socketId }
const userSocketMap = new Map();

// Initialize io
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Read whitelist from env or default
            const rawWhitelist = process.env.CORS_WHITELIST || 'http://localhost:5173';
            const whitelist = rawWhitelist.split(',').map(s => s.trim());
            
            if (!origin || whitelist.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
    },
});

export const getSocketId = (userId) => userSocketMap.get(userId);
export const getOnlineUsers = () => Array.from(userSocketMap.keys());

io.on('connection', (socket) => {
    // 1. Handle Connection & User Identity
    const userId = socket.handshake.query.userId;

    if (userId) {
        console.log(`User connected: ${userId} (${socket.id})`);
        
        // Save user to the map
        userSocketMap.set(userId, socket.id);
        
        // Attach userId to the socket object for easy access later
        socket.userId = userId;

        // Update user status in DB to Online
        User.findByIdAndUpdate(userId, { isOnline: true }).catch(err => console.error(err));

        // Emit event to ALL clients with the updated list of online user IDs
        io.emit('onlineUsers', getOnlineUsers());
    }

    // 2. Handle Typing Events (NEW)
    socket.on('typing', ({ receiverId }) => {
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            // Tell the receiver that THIS user (socket.userId) is typing
            io.to(receiverSocketId).emit('userTyping', { senderId: socket.userId });
        }
    });

    socket.on('stopTyping', ({ receiverId }) => {
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userStoppedTyping', { senderId: socket.userId });
        }
    });

    // 3. Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId || socket.id}`);
        
        if (userId) {
            // Remove from map
            userSocketMap.delete(userId);
            
            // Update user status in DB to Offline
            User.findByIdAndUpdate(userId, { isOnline: false }).catch(err => console.error(err));

            // Emit updated list to all clients
            io.emit('onlineUsers', getOnlineUsers());
        }
    });
});

export { app, server, io };