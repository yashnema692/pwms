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
            const rawWhitelist = process.env.CORS_WHITELIST || 'http://localhost:5173,http://localhost:3000,https://crmyashnema1.netlify.app';
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
    console.log('A user connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        console.log(`User ${userId} joined.`);
        userSocketMap.set(userId, socket.id);
        
        // Update user status in DB
        User.findByIdAndUpdate(userId, { isOnline: true }).catch(err => console.error(err));

        // Emit event to all clients with the list of online user IDs
        io.emit('onlineUsers', getOnlineUsers());
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (userId) {
            userSocketMap.delete(userId);
            
            // Update user status in DB
            User.findByIdAndUpdate(userId, { isOnline: false }).catch(err => console.error(err));

            // Emit updated list
            io.emit('onlineUsers', getOnlineUsers());
        }
    });
});

export { app, server, io };