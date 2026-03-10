const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    roundNumber: {
        type: Number,
        required: true
    },
    roundType: {
        type: String,
        enum: ['APTITUDE', 'MCQ', 'CODING', 'SQL', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'AI_INTERVIEW'],
        required: true
    },
    duration: {
        type: Number, // In minutes
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    }
});

const interviewBlueprintSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    rounds: [roundSchema]
}, { timestamps: true });

module.exports = mongoose.model('InterviewBlueprint', interviewBlueprintSchema);
