const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');
const { finalizeTestAttempt } = require('./services/resultEngineService');
require('dotenv').config();

async function testRecalculation() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        // Find a completed attempt
        const attempt = await TestAttempt.findOne({ status: 'COMPLETED' });
        if (!attempt) return console.log('No completed attempts found');

        console.log(`Original Attempt Score: ${attempt.score}%`);

        // Find a round attempt for this attempt
        const ra = await RoundAttempt.findOne({ attemptId: attempt._id });
        if (!ra) return console.log('No round attempts found for this attempt');

        console.log(`Original Round Score: ${ra.score}`);

        // Update round score
        ra.score = (ra.score || 0) + 10;
        await ra.save();
        console.log(`Updated Round Score to: ${ra.score}`);

        // Finalize again
        const updated = await finalizeTestAttempt(attempt._id, { TestAttempt, RoundAttempt });
        console.log(`New Attempt Score: ${updated.score}%`);

        if (updated.score !== attempt.score) {
            console.log('SUCCESS: Score was recalculated and updated!');
        } else {
            console.log('FAILURE: Score remained the same.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testRecalculation();
