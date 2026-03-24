const mongoose = require('mongoose');
const RoundAttempt = require('./models/RoundAttempt');
require('dotenv').config();

async function dumpRoundAttempt() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const latestInterview = await RoundAttempt.findOne({ 
            roundType: { $in: ['TECHNICAL_INTERVIEW', 'HR_INTERVIEW'] },
            completed: true
        }).sort({ createdAt: -1 });

        if (latestInterview) {
            console.log('Latest Interview RoundAttempt:');
            console.log('  ID:', latestInterview._id);
            console.log('  Type:', latestInterview.roundType);
            console.log('  Answers:', JSON.stringify(latestInterview.answers, null, 2));
            console.log('  Answers type:', typeof latestInterview.answers);
            console.log('  Is Map?', latestInterview.answers instanceof Map);
            
            const lean = await RoundAttempt.findById(latestInterview._id).lean();
            console.log('  Lean Answers:', JSON.stringify(lean.answers, null, 2));
            console.log('  Lean Answers type:', typeof lean.answers);
        } else {
            console.log('No completed interview round attempts found.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

dumpRoundAttempt();
