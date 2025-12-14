import Attendance from '../models/Attendance.js';
import path from 'path';
import fs from 'fs';

// Helper: Save Base64 Image to Disk
const saveImage = (base64Data, userId, type) => {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `attendance_${userId}_${type}_${Date.now()}.jpg`;
    
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    
    const uploadPath = path.join('uploads', filename);
    fs.writeFileSync(uploadPath, buffer);
    return `/uploads/${filename}`;
};

// @desc    Mark Attendance (Morning or Evening)
// @route   POST /api/attendance/mark
// @access  Private
export const markAttendance = async (req, res) => {
    try {
        const userId = req.user._id;
        const { image, location, address, type } = req.body; 
        
        const today = new Date().toISOString().split('T')[0];
        let attendance = await Attendance.findOne({ user: userId, date: today });

        // --- MORNING SHIFT (CHECK IN) ---
        if (type === 'MORNING') {
            if (attendance) {
                return res.status(400).json({ message: 'You have already checked in today.' });
            }
            
            const photoUrl = saveImage(image, userId, 'in');
            
            attendance = new Attendance({
                user: userId,
                date: today,
                checkIn: {
                    time: new Date(),
                    location: { ...location, address }, // Save Morning Address
                    photoUrl
                }
            });
            await attendance.save();
            return res.status(201).json({ message: 'Morning Shift Marked! ✅', data: attendance });
        }

        // --- EVENING SHIFT (CHECK OUT) ---
        if (type === 'EVENING') {
            if (!attendance) {
                return res.status(400).json({ message: 'No Morning Check-In found! Please check in first.' });
            }
            if (attendance.checkOut && attendance.checkOut.time) {
                return res.status(400).json({ message: 'Evening shift already marked!' });
            }

            const photoUrl = saveImage(image, userId, 'out');
            
            attendance.checkOut = {
                time: new Date(),
                location: { ...location, address }, // Save Evening Address
                photoUrl
            };

            // Calculate Duration in Minutes
            const durationMs = attendance.checkOut.time - attendance.checkIn.time;
            attendance.duration = Math.round(durationMs / 60000); 

            await attendance.save();
            return res.status(200).json({ message: 'Evening Shift Marked! 🌙', data: attendance });
        }

        return res.status(400).json({ message: 'Invalid Attendance Type' });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get User's Own History
export const getMyAttendance = async (req, res) => {
    try {
        const history = await Attendance.find({ user: req.user._id }).sort({ date: -1 });
        res.json(history);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Get All Records (Admin)
export const getAllAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        if (date) query.date = date; 

        const records = await Attendance.find(query)
            .populate('user', 'email')
            .sort({ date: -1 });
        res.json(records);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};