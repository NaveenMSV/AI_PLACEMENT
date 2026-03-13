const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'public'],
        default: 'student'
    },
    college: {
        type: String,
        default: null
    },
    profilePicture: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Student specific tracking
    enrolledCompanies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    totalAttempts: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    },
    resumePath: {
        type: String,
        default: null
    },
    atsScore: {
        type: Number,
        default: 0
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
