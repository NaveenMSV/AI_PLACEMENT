const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['CODING', 'SQL'],
        default: 'CODING'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    }
}, { timestamps: true });

// Add compound index for date and type
dailyChallengeSchema.index({ date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
