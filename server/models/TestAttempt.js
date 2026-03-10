const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'],
        default: 'IN_PROGRESS'
    },
    score: {
        type: Number,
        default: 0
    },
    warningsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
