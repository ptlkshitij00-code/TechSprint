const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    startTime: {
        type: String,
        required: true // Format: "09:00"
    },
    endTime: {
        type: String,
        required: true // Format: "10:00"
    },
    room: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial'],
        default: 'lecture'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Compound index to prevent duplicate entries
timetableSchema.index({ day: 1, startTime: 1, room: 1 }, { unique: true });
timetableSchema.index({ day: 1, startTime: 1, faculty: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
