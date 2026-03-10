const mongoose = require('mongoose');

const warningLogSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestAttempt',
        required: true
    },
    type: {
        type: String,
        enum: [
            'TAB_SWITCH',
            'COPY_PASTE',
            'RIGHT_CLICK',
            'SCREENSHOT',
            'SCREENSHOT_SHORTCUT',
            'BACK_BUTTON',
            'FULLSCREEN_EXIT',
            'DEVTOOLS_ACCESS'
        ],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WarningLog', warningLogSchema);
