import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Project from './models/Project.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Project.deleteMany({});
        await AuditLog.deleteMany({});
        console.log('Cleared existing data.');

        // Create Users
        const adminUser = await User.create({
            email: 'admin@demo.com',
            password: 'Admin@123',
            role: 'ADMIN',
        });

        const memberUser = await User.create({
            email: 'member@demo.com',
            password: 'Member@123',
            role: 'MEMBER',
        });
        console.log('Created admin and member users.');

        // Create Sample Projects
        const projectsData = [
            { title: 'New Website Design', client: 'Innovate Corp', budget: 5000, status: 'IN_PROGRESS', ownerId: adminUser._id },
            { title: 'Mobile App Development', client: 'Tech Solutions', budget: 15000, status: 'DONE', ownerId: memberUser._id },
            { title: 'Marketing Campaign', client: 'Global Ads', budget: 7500, status: 'LEAD', ownerId: adminUser._id },
            { title: 'Cloud Migration', client: 'Server Co', budget: 25000, status: 'ON_HOLD', ownerId: memberUser._id },
            { title: 'E-commerce Platform', client: 'Shopify Plus', budget: 30000, status: 'IN_PROGRESS', ownerId: adminUser._id },
            { title: 'Brand Identity', client: 'Creative Inc', budget: 3500, status: 'DONE', ownerId: memberUser._id },
        ];
        
        await Project.insertMany(projectsData);
        console.log('Seeded sample projects.');
        
        console.log('Database seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedDatabase();
