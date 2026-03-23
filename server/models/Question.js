const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    roundType: {
        type: String,
        required: true,
        enum: ['APTITUDE', 'MCQ', 'CODING', 'SQL', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'AI_INTERVIEW']
    },
    roundNumber: {
        type: Number,
        default: null
    },
    questionType: {
        type: String,
        required: true,
        enum: ['MCQ', 'CODING', 'SQL']
    },
    // the text describing the problem
    question: {
        type: String,
        required: true
    },
    // MCQ specific
    options: {
        type: [String],
        default: []
    },
    correctAnswer: {
        type: String, // Value for MCQ or exact match for SQL/Coding basic checks
        required: false
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    // CODING specific
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false }
    }],
    // For admin review/explanations
    solution: {
        type: String,
        default: null
    },
    // Language-specific starting code
    boilerplates: {
        type: Map,
        of: String,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
