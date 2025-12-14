import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Import socket server setup
import { app, server } from './socket/socket.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import noteRoutes from './routes/noteRoutes.js'; 
import attendanceRoutes from './routes/attendanceRoutes.js';
dotenv.config();
connectDB(); // Connect to MongoDB

// --- ES Module Path Fix ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read whitelist from env or default
const rawWhitelist = process.env.CORS_WHITELIST || 'http://localhost:5173';
const whitelist = rawWhitelist.split(',').map(s => s.trim());

const corsOptions = {
    origin: (origin, callback) => {
        // allow requests like curl/postman where origin is undefined
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) return callback(null, true);
        console.warn('Blocked CORS request from:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// --- STATIC FILES ---
// This serves images for Chat Attachments and Announcement Banners
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/messages', messageRoutes); // Handles Edit/Delete logic internally
app.use('/api/notes', noteRoutes);       // Handles Announcements

app.use('/api/attendance', attendanceRoutes);
const PORT = process.env.PORT || 5001;

// Use the 'server' from socket.js to listen (required for Socket.io)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));