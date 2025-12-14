// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path'; // <--- NEW: Required for file paths
import { fileURLToPath } from 'url'; // <--- NEW: Required for ES Modules
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
dotenv.config();
connectDB(); // Connect to MongoDB

// --- ES Module Path Fix ---
// unique to ES modules (type: "module" in package.json) to get __dirname
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

// --- STATIC FILES (For Chat Attachments) ---
// This allows the frontend to access images at http://localhost:5001/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notes', noteRoutes); 
const PORT = process.env.PORT || 5001;
// Use the 'server' from socket.js to listen, not 'app'
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));