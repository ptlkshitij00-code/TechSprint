const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const { protect, isAdmin } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', protect, isAdmin, async (req, res) => {
    try {
        const [
            totalStudents,
            totalFaculty,
            totalSubjects,
            totalSessions,
            activeStudents,
            activeFaculty
        ] = await Promise.all([
            User.countDocuments({ role: ROLES.STUDENT }),
            User.countDocuments({ role: ROLES.FACULTY }),
            Subject.countDocuments({ isActive: true }),
            AttendanceSession.countDocuments(),
            User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
            User.countDocuments({ role: ROLES.FACULTY, isActive: true })
        ]);

        // Recent sessions
        const recentSessions = await AttendanceSession.find()
            .populate('subject', 'name')
            .populate('faculty', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Attendance statistics for the month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyAttendance = await AttendanceRecord.aggregate([
            { $match: { date: { $gte: monthStart } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalFaculty,
                totalSubjects,
                totalSessions,
                activeStudents,
                activeFaculty
            },
            recentSessions,
            monthlyAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
});

// @route   GET /api/admin/attendance-report
// @desc    Get comprehensive attendance report
// @access  Private/Admin
router.get('/attendance-report', protect, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, branch, semester } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Build student filter
        const studentFilter = { role: ROLES.STUDENT };
        if (branch) studentFilter.branch = branch;
        if (semester) studentFilter.semester = parseInt(semester);

        const students = await User.find(studentFilter).select('_id name rollNumber branch semester');
        const studentIds = students.map(s => s._id);

        // Get attendance records
        const recordFilter = { student: { $in: studentIds } };
        if (Object.keys(dateFilter).length > 0) {
            recordFilter.date = dateFilter;
        }

        const records = await AttendanceRecord.find(recordFilter)
            .populate('subject', 'name code')
            .populate('student', 'name rollNumber branch semester');

        // Calculate statistics per student
        const studentStats = students.map(student => {
            const studentRecords = records.filter(r => r.student._id.toString() === student._id.toString());
            const total = studentRecords.length;
            const present = studentRecords.filter(r => r.status === 'present').length;
            const late = studentRecords.filter(r => r.status === 'late').length;
            const absent = studentRecords.filter(r => r.status === 'absent').length;

            return {
                student: {
                    id: student._id,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    branch: student.branch,
                    semester: student.semester
                },
                totalClasses: total,
                present,
                late,
                absent,
                percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
            };
        });

        // Sort by percentage (ascending for low attendance first)
        studentStats.sort((a, b) => a.percentage - b.percentage);

        res.json({
            success: true,
            totalStudents: students.length,
            lowAttendanceStudents: studentStats.filter(s => s.percentage < 75).length,
            report: studentStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating report',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/settings/geofence
// @desc    Update geofence settings
// @access  Private/Admin
router.put('/settings/geofence', protect, isAdmin, async (req, res) => {
    try {
        const { defaultRadius, strictMode } = req.body;

        // In a real app, this would update a settings collection
        // For now, return success
        res.json({
            success: true,
            message: 'Geofence settings updated',
            settings: {
                defaultRadius: defaultRadius || 50,
                strictMode: strictMode || false
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
});

// @route   POST /api/admin/bulk-register
// @desc    Bulk register users from CSV/JSON
// @access  Private/Admin
router.post('/bulk-register', protect, isAdmin, async (req, res) => {
    try {
        const { users, role } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of users'
            });
        }

        const results = {
            success: [],
            failed: []
        };

        for (const userData of users) {
            try {
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    results.failed.push({
                        email: userData.email,
                        reason: 'Email already exists'
                    });
                    continue;
                }

                const user = await User.create({
                    ...userData,
                    role: role || userData.role || ROLES.STUDENT,
                    password: userData.password || 'College@123'
                });

                results.success.push({
                    email: user.email,
                    name: user.name
                });
            } catch (error) {
                results.failed.push({
                    email: userData.email,
                    reason: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Registered ${results.success.length} users, ${results.failed.length} failed`,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error bulk registering users',
            error: error.message
        });
    }
});

module.exports = router;
