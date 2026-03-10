const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const Company = require('../models/Company');
const RoundAttempt = require('../models/RoundAttempt');
const mongoose = require('mongoose');

// Helper to recalculate and update User's averageScore and totalAttempts
const updateStudentStats = async (studentId) => {
    const completedAttempts = await TestAttempt.find({
        studentId,
        status: { $in: ['COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'] }
    });

    const totalAttempts = completedAttempts.length;
    let averageScore = 0;

    if (totalAttempts > 0) {
        const sum = completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
        averageScore = Math.round(sum / totalAttempts);
    }

    await User.findByIdAndUpdate(studentId, {
        totalAttempts,
        averageScore
    });

    return { totalAttempts, averageScore };
};

// @desc    Get Student Dashboard Stats
// @route   GET /api/student/dashboard/stats
const getDashboardStats = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const studentId = req.user._id;

        // 1. Total Hours Practiced
        const completedAttempts = await TestAttempt.find({
            studentId,
            status: { $in: ['COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'] },
            endTime: { $ne: null }
        });

        const totalMs = completedAttempts.reduce((acc, attempt) => {
            return acc + (attempt.endTime - attempt.startTime);
        }, 0);
        const hoursPracticed = Math.round(totalMs / (1000 * 60 * 60));

        // 2. Platform Rank
        // Logic: Rank by average score or total score. Let's do averageScore field on User if exists, or calculate on the fly.
        // For efficiency, we assume a leaderboard aggregation exists or we do a simple sort.
        const allStudents = await User.find({ role: 'student' }).sort({ averageScore: -1 });
        const rank = allStudents.findIndex(s => s._id.equals(studentId)) + 1;

        // 3. Overall Readiness (Weighted average of last 5 attempts)
        const last5 = await TestAttempt.find({ studentId, status: 'COMPLETED' })
            .sort({ createdAt: -1 })
            .limit(5);

        let readiness = 0;
        if (last5.length > 0) {
            // Apply descending weights: 5, 4, 3, 2, 1
            const weights = [5, 4, 3, 2, 1];
            let weightedSum = 0;
            let totalWeight = 0;

            last5.forEach((curr, index) => {
                const weight = weights[index] || 1;
                weightedSum += curr.score * weight;
                totalWeight += weight;
            });

            readiness = Math.round(weightedSum / totalWeight);
        }

        res.json({
            rank: `#${rank}`,
            interviewsGiven: completedAttempts.length,
            readiness: `${readiness}%`,
            hoursPracticed: `${hoursPracticed}h`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Enrolled Company Tracks Progress
// @route   GET /api/student/dashboard/tracks
const getEnrolledTracks = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const studentId = req.user._id;
        const user = await User.findById(studentId).populate('enrolledCompanies');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const tracks = await Promise.all(user.enrolledCompanies.map(async (company) => {
            const latestAttempt = await TestAttempt.findOne({
                studentId,
                companyId: company._id
            }).sort({ createdAt: -1 });

            let roundsDone = 0;
            let status = 'NONE';
            let isCompleted = false;
            let progress = 0;

            if (latestAttempt) {
                status = latestAttempt.status;
                isCompleted = ['COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'].includes(status);

                // Count completed rounds in the latest attempt
                roundsDone = await RoundAttempt.countDocuments({
                    attemptId: latestAttempt._id,
                    completed: true
                });

                const totalRounds = company.numberOfRounds || 2; // Default to 2 for TCS if not set
                progress = isCompleted ? 100 : Math.min(Math.round((roundsDone / totalRounds) * 100), 99);
            }

            return {
                _id: company._id,
                name: company.name,
                roundsDone,
                totalRounds: company.numberOfRounds || 2,
                progress,
                isCompleted,
                status
            };
        }));

        res.json(tracks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const refreshDashboardStats = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Force recalculate user stats
        await updateStudentStats(studentId);

        // This confirms the action to the frontend
        res.json({ message: 'Dashboard stats refreshed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getEnrolledTracks,
    refreshDashboardStats,
    updateStudentStats
};
