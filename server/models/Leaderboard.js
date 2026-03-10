const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    timeTaken: {
        type: Number, // In seconds
        required: true
    },
    rank: {
        type: Number,
        default: null
    }
}, { timestamps: true });

// Ensures a student only has one entry per company leaderboard
leaderboardSchema.index({ companyId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
