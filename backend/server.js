// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js'; // Assuming you meant to use db.js

// Import socket server setup
import { app, server } from './socket/socket.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import messageRoutes from './routes/messageRoutes.js';


dotenv.config();
connectDB(); // Connect to MongoDB

// Read whitelist from env or default
const rawWhitelist = process.env.CORS_WHITELIST || 'http://localhost:5173,http://localhost:3000,https://crmyashnema1.netlify.app';
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/users', userRoutes); // NEW
app.use('/api/teams', teamRoutes); // NEW
app.use('/api/messages', messageRoutes); // NEW

const PORT = process.env.PORT || 5001;
// Use the 'server' from socket.js to listen, not 'app'
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));