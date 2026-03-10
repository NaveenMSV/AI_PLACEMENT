const mongoose = require('mongoose');

const roundAttemptSchema = new mongoose.Schema({
    attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestAttempt',
        required: true
    },
    roundNumber: {
        type: Number,
        required: true
    },
    roundType: {
        type: String,
        required: true,
        enum: ['APTITUDE', 'MCQ', 'CODING', 'SQL', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'AI_INTERVIEW']
    },
    // Map of question ID to student's answer string
    answers: {
        type: Map,
        of: String,
        default: {}
    },
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    correctCount: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number, // In seconds
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('RoundAttempt', roundAttemptSchema);
