import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    date: { 
        type: String, // Format: YYYY-MM-DD
        required: true 
    },
    checkIn: {
        time: { type: Date },
        location: {
            lat: Number,
            lng: Number,
            address: String // Stores "Morning Location"
        },
        photoUrl: { type: String }
    },
    checkOut: {
        time: { type: Date },
        location: {
            lat: Number,
            lng: Number,
            address: String // Stores "Evening Location"
        },
        photoUrl: { type: String }
    },
    duration: { type: Number, default: 0 } // Total minutes worked
}, { timestamps: true });

// Prevent duplicate attendance for the same user on the same date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;